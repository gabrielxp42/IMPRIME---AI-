# -*- coding: utf-8 -*-
"""
FastAPI server for SAM-based image segmentation
Provides endpoints for intelligent background removal with Segment Anything Model
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
from PIL import Image
import io
import base64
import uvicorn
import os
import sys
import requests
from pathlib import Path

# Check for SAM availability
SAM_AVAILABLE = False
REMBG_AVAILABLE = False

try:
    from segment_anything import sam_model_registry, SamPredictor
    SAM_AVAILABLE = True
    print("[SAM] Segment Anything Model disponível")
except ImportError:
    print("[SAM] segment_anything não instalado. Usando modo fallback.")

try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
    print("[REMBG] rembg disponível para refinamento")
except ImportError:
    print("[REMBG] rembg não instalado. Refinamento simplificado.")

app = FastAPI(
    title="SAM Background Removal API",
    version="1.0.0",
    description="API para remoção inteligente de fundo usando SAM e refinamento"
)

# Enable CORS for Electron renderer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
sam_predictor = None
MODEL_DIR = Path(__file__).parent / "models"
SAM_CHECKPOINT_URL = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
SAM_CHECKPOINT_NAME = "sam_vit_b_01ec64.pth"


# Request/Response Models
class Point(BaseModel):
    x: int
    y: int
    label: int  # 1 for foreground, 0 for background


class Box(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class SegmentPointsRequest(BaseModel):
    points: List[Point]
    image_base64: str


class SegmentBoxRequest(BaseModel):
    box: Box
    image_base64: str


class RefineMaskRequest(BaseModel):
    image_base64: str
    mask_base64: str


class AutoRemoveRequest(BaseModel):
    image_base64: str


# Helper functions
def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decode base64 string to numpy array (RGB format)"""
    try:
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        image_bytes = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image.convert("RGB"))
        return image_np
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def decode_base64_to_pil(base64_str: str) -> Image.Image:
    """Decode base64 string to PIL Image"""
    try:
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        image_bytes = base64.b64decode(base64_str)
        return Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def encode_mask_to_base64(mask: np.ndarray) -> str:
    """Encode numpy mask array to base64 PNG"""
    try:
        if mask.dtype != np.uint8:
            if mask.max() <= 1.0:
                mask = (mask * 255).astype(np.uint8)
            else:
                mask = mask.astype(np.uint8)
        
        pil_image = Image.fromarray(mask, mode='L')
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        base64_str = base64.b64encode(buffer.read()).decode('utf-8')
        return f"data:image/png;base64,{base64_str}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error encoding mask: {str(e)}")


def encode_image_to_base64(image: Image.Image) -> str:
    """Encode PIL Image to base64 PNG"""
    try:
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        
        base64_str = base64.b64encode(buffer.read()).decode('utf-8')
        return f"data:image/png;base64,{base64_str}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error encoding image: {str(e)}")


def download_sam_model():
    """Download SAM model checkpoint if not exists"""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint_path = MODEL_DIR / SAM_CHECKPOINT_NAME
    
    if checkpoint_path.exists():
        print(f"[SAM] Modelo já existe: {checkpoint_path}")
        return str(checkpoint_path)
    
    print(f"[SAM] Baixando modelo SAM ({SAM_CHECKPOINT_NAME})...")
    print(f"[SAM] URL: {SAM_CHECKPOINT_URL}")
    print(f"[SAM] Destino: {checkpoint_path}")
    
    try:
        response = requests.get(SAM_CHECKPOINT_URL, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(checkpoint_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size:
                    progress = (downloaded / total_size) * 100
                    print(f"\r[SAM] Download: {progress:.1f}%", end="", flush=True)
        
        print(f"\n[SAM] Download concluído: {checkpoint_path}")
        return str(checkpoint_path)
    except Exception as e:
        print(f"[SAM] Erro ao baixar modelo: {e}")
        return None


def initialize_sam():
    """Initialize SAM model"""
    global sam_predictor
    
    if not SAM_AVAILABLE:
        print("[SAM] segment_anything não disponível")
        return False
    
    try:
        checkpoint_path = download_sam_model()
        if not checkpoint_path:
            return False
        
        print("[SAM] Carregando modelo SAM...")
        
        # Use ViT-B (smaller, faster)
        sam = sam_model_registry["vit_b"](checkpoint=checkpoint_path)
        
        # Use CUDA if available
        device = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
                print("[SAM] Usando GPU (CUDA)")
            else:
                print("[SAM] Usando CPU")
        except:
            print("[SAM] Usando CPU (torch não detectado)")
        
        sam.to(device=device)
        sam_predictor = SamPredictor(sam)
        
        print("[SAM] Modelo SAM carregado com sucesso!")
        return True
    except Exception as e:
        print(f"[SAM] Erro ao carregar modelo: {e}")
        return False


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SAM Background Removal API",
        "version": "1.0.0",
        "sam_available": SAM_AVAILABLE and sam_predictor is not None,
        "rembg_available": REMBG_AVAILABLE
    }


@app.get("/health")
async def health():
    """Check if models are loaded"""
    return {
        "status": "ok",
        "sam_loaded": sam_predictor is not None,
        "rembg_available": REMBG_AVAILABLE
    }


@app.post("/api/segment/points")
async def segment_with_points(request: SegmentPointsRequest):
    """Generate segmentation mask based on user-clicked points"""
    try:
        image = decode_base64_image(request.image_base64)
        
        if sam_predictor is None:
            # Fallback: simple threshold-based segmentation
            return await fallback_segment(image, request.points)
        
        # Set image for SAM
        sam_predictor.set_image(image)
        
        # Extract points and labels
        points = np.array([[p.x, p.y] for p in request.points])
        labels = np.array([p.label for p in request.points])
        
        # Generate masks
        masks, scores, logits = sam_predictor.predict(
            point_coords=points,
            point_labels=labels,
            multimask_output=True
        )
        
        # Get best mask (highest score)
        best_idx = np.argmax(scores)
        best_mask = masks[best_idx]
        best_score = float(scores[best_idx])
        
        # Convert to uint8
        mask_uint8 = (best_mask * 255).astype(np.uint8)
        
        return JSONResponse(content={
            "success": True,
            "mask": encode_mask_to_base64(mask_uint8),
            "confidence": best_score
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


async def fallback_segment(image: np.ndarray, points: List[Point]):
    """Fallback segmentation when SAM is not available"""
    h, w = image.shape[:2]
    
    # Create mask based on color similarity to clicked points
    mask = np.zeros((h, w), dtype=np.float32)
    
    for point in points:
        if point.label == 1:  # Foreground
            # Get color at point
            color = image[point.y, point.x]
            
            # Calculate color distance for entire image
            diff = np.sqrt(np.sum((image.astype(np.float32) - color.astype(np.float32)) ** 2, axis=2))
            
            # Create soft mask based on color similarity
            similarity = 1 - (diff / (diff.max() + 1e-6))
            mask = np.maximum(mask, similarity)
    
    # Apply threshold
    mask = (mask > 0.5).astype(np.float32)
    
    # Smooth edges
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    
    mask_uint8 = (mask * 255).astype(np.uint8)
    
    return JSONResponse(content={
        "success": True,
        "mask": encode_mask_to_base64(mask_uint8),
        "confidence": 0.7,
        "fallback": True
    })


@app.post("/api/segment/box")
async def segment_with_box(request: SegmentBoxRequest):
    """Generate segmentation mask based on bounding box"""
    try:
        image = decode_base64_image(request.image_base64)
        
        if sam_predictor is None:
            # Fallback: use GrabCut
            return await fallback_grabcut(image, request.box)
        
        # Set image for SAM
        sam_predictor.set_image(image)
        
        # Box coordinates
        box = np.array([request.box.x1, request.box.y1, request.box.x2, request.box.y2])
        
        # Generate mask
        masks, scores, logits = sam_predictor.predict(
            box=box,
            multimask_output=True
        )
        
        # Get best mask
        best_idx = np.argmax(scores)
        best_mask = masks[best_idx]
        best_score = float(scores[best_idx])
        
        mask_uint8 = (best_mask * 255).astype(np.uint8)
        
        return JSONResponse(content={
            "success": True,
            "mask": encode_mask_to_base64(mask_uint8),
            "confidence": best_score
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


async def fallback_grabcut(image: np.ndarray, box: Box):
    """Fallback using OpenCV GrabCut"""
    h, w = image.shape[:2]
    
    # Initialize mask for GrabCut
    mask = np.zeros((h, w), np.uint8)
    
    # Background and foreground models
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    
    # Rectangle for GrabCut
    rect = (
        max(0, box.x1),
        max(0, box.y1),
        min(w, box.x2) - max(0, box.x1),
        min(h, box.y2) - max(0, box.y1)
    )
    
    # Apply GrabCut
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    cv2.grabCut(image_bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    
    # Create binary mask
    result_mask = np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)
    
    return JSONResponse(content={
        "success": True,
        "mask": encode_mask_to_base64(result_mask),
        "confidence": 0.75,
        "fallback": True
    })


@app.post("/api/refine-mask")
async def refine_mask(request: RefineMaskRequest):
    """Refine mask using rembg for smoother edges"""
    try:
        pil_image = decode_base64_to_pil(request.image_base64)
        
        if REMBG_AVAILABLE:
            # Use rembg for high-quality refinement
            result = rembg_remove(pil_image, alpha_matting=True)
            
            # Extract alpha channel as refined mask
            if result.mode == 'RGBA':
                alpha = np.array(result.split()[-1])
            else:
                alpha = np.array(result.convert('L'))
            
            return JSONResponse(content={
                "success": True,
                "refined_mask": encode_mask_to_base64(alpha)
            })
        else:
            # Fallback: simple edge smoothing
            mask_pil = decode_base64_to_pil(request.mask_base64).convert('L')
            mask = np.array(mask_pil)
            
            # Apply morphological operations
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.GaussianBlur(mask, (7, 7), 0)
            
            return JSONResponse(content={
                "success": True,
                "refined_mask": encode_mask_to_base64(mask),
                "fallback": True
            })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mask refinement failed: {str(e)}")


@app.post("/api/apply-mask")
async def apply_mask(request: RefineMaskRequest):
    """Apply mask to image and return result with transparent background"""
    try:
        pil_image = decode_base64_to_pil(request.image_base64).convert('RGB')
        mask_pil = decode_base64_to_pil(request.mask_base64).convert('L')
        
        # Resize mask to match image if needed
        if mask_pil.size != pil_image.size:
            mask_pil = mask_pil.resize(pil_image.size, Image.LANCZOS)
        
        # Create RGBA image
        result = pil_image.copy()
        result.putalpha(mask_pil)
        
        return JSONResponse(content={
            "success": True,
            "result_image": encode_image_to_base64(result)
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mask application failed: {str(e)}")


@app.post("/api/auto-remove")
async def auto_remove_background(request: AutoRemoveRequest):
    """Automatically remove background using rembg"""
    try:
        if not REMBG_AVAILABLE:
            raise HTTPException(status_code=503, detail="rembg not available")
        
        pil_image = decode_base64_to_pil(request.image_base64)
        
        # Use rembg with alpha matting for best quality
        result = rembg_remove(pil_image, alpha_matting=True)
        
        return JSONResponse(content={
            "success": True,
            "result_image": encode_image_to_base64(result)
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto remove failed: {str(e)}")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    print("=" * 60)
    print("  SAM Background Removal API - Starting...")
    print("=" * 60)
    
    # Try to initialize SAM
    if SAM_AVAILABLE:
        success = initialize_sam()
        if not success:
            print("[WARN] SAM não pôde ser inicializado. Usando fallback.")
    
    print("=" * 60)
    print(f"  API pronta em http://localhost:8000")
    print(f"  Docs em http://localhost:8000/docs")
    print(f"  SAM: {'✓' if sam_predictor else '✗ (usando fallback)'}")
    print(f"  REMBG: {'✓' if REMBG_AVAILABLE else '✗'}")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global sam_predictor
    sam_predictor = None
    print("SAM API encerrada.")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
