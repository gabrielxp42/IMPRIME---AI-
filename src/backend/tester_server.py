# -*- coding: utf-8 -*-
"""
Servidor BiRefNet OTIMIZADO (Speed + Quality)
Modelo: BiRefNet (Melhor qualidade)
Resolução: 1024x1024 (Rápido - ~15s)
Extras: Gamma Boost 0.4 (Salva textos finos) + Proteção Recursiva
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from PIL import Image
import torch
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
import numpy as np

app = FastAPI(title="BiRefNet Speed", version="Final.Speed")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
device = None

class ImageRequest(BaseModel):
    image_base64: str
    threshold: float = 0.5 

def get_model():
    global model, device
    if model is None:
        print("Carregando BiRefNet Otimizado...")
        try:
            model = AutoModelForImageSegmentation.from_pretrained('ZhengPeng7/BiRefNet', trust_remote_code=True)
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model.to(device)
            model.eval()
            print(f"BiRefNet Carregado! Device: {device}")
        except Exception as e:
            print(f"Erro: {e}")
            raise e
    return model, device

# Função RECURSIVA para extrair tensor (Blindagem)
def find_tensor(obj):
    if isinstance(obj, torch.Tensor):
        return obj
    if hasattr(obj, 'logits'):
        return find_tensor(obj.logits)
    if isinstance(obj, (list, tuple)):
        # As vezes o tensor bom está no final, as vezes no começo.
        # BiRefNet costuma retornar 3 tensores, o primeiro costuma ser o melhor (high res).
        for item in obj:
            res = find_tensor(item)
            if res is not None:
                return res
    return None

def process_image(im: Image.Image):
    model, device = get_model()
    w, h = im.size
    
    # RESOLUÇÃO OTIMIZADA: 1024x1024
    # É o equilíbrio perfeito entre velocidade e detalhe.
    target_size = 1024
    scale = target_size / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    # Múltiplo de 32
    new_w = (new_w // 32) * 32
    new_h = (new_h // 32) * 32
    
    # Resize suave
    im_resized = im.resize((new_w, new_h), Image.BILINEAR)
    
    # Normalização padrão
    tensor_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    
    input_images = tensor_transform(im_resized).unsqueeze(0).to(device)
    
    with torch.no_grad():
        preds = model(input_images)
        
    # Extração Segura
    final_pred = find_tensor(preds)
    
    if final_pred is None:
        raise ValueError("ERRO CRÍTICO: Modelo não retornou tensor válido.")
        
    pred = final_pred.sigmoid().cpu().squeeze()
    
    # Remove dimensão de canal se houver
    if pred.dim() == 3:
        pred = pred[0]
        
    # GAMMA BOOST (Salva texto fino na resolução 1024)
    pred = pred.pow(0.4)
        
    pred_pil = transforms.ToPILImage()(pred)
    mask = pred_pil.resize((w, h), Image.BILINEAR)
    
    return mask

@app.on_event("startup")
async def startup_event():
    try: get_model()
    except: pass

@app.post("/remove")
async def remove_background(request: ImageRequest):
    try:
        if "base64," in request.image_base64:
            base64_data = request.image_base64.split("base64,")[1]
        else:
            base64_data = request.image_base64
        image_bytes = base64.b64decode(base64_data)
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        mask = process_image(original_image)
        
        final_image = original_image.convert("RGBA")
        final_image.putalpha(mask)
        
        buffered = io.BytesIO()
        final_image.save(buffered, format="PNG")
        result_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return {"success": True, "result_image": f"data:image/png;base64,{result_base64}"}
    except Exception as e:
        print(f"Erro: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print("Iniciando BiRefNet SPEED na porta 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
