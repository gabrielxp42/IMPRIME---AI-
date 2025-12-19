"""
DTF Halftone - Método Correto
Baseado no tutorial oficial de DTF halftone
"""

import sys
import win32com.client
import pythoncom
import time

def test_dtf_halftone():
    """Aplica halftone DTF usando o método correto do tutorial"""
    
    print("=" * 70)
    print("DTF HALFTONE - MÉTODO CORRETO (baseado no tutorial)")
    print("=" * 70)
    print()
    
    pythoncom.CoInitialize()
    
    try:
        # Conectar ao Photoshop
        print("[1] Conectando ao Photoshop...")
        ps_app = win32com.client.Dispatch("Photoshop.Application")
        
        if ps_app.Documents.Count == 0:
            print("     ❌ Nenhum documento aberto!")
            return False
        
        doc = ps_app.ActiveDocument
        print(f"     ✅ Documento: {doc.Name}")
        print("\n     👀 OLHE A IMAGEM ORIGINAL")
        input("     ⏸️  Pressione ENTER para processar...")
        
        # PROCESSO COMPLETO DE DTF HALFTONE
        print("\n[2] Aplicando halftone DTF...")
        jsx = '''
(function() {
    app.displayDialogs = DialogModes.NO;
    var doc = app.activeDocument;
    
    // PASSO 1: Converter para Grayscale
    if (doc.mode !== DocumentMode.GRAYSCALE) {
        doc.changeMode(ChangeMode.GRAYSCALE);
    }
    
    // PASSO 2: Ajustar Levels (controla o que vira halftone)
    // Mover sliders para ajustar tonalidade
    var levelsDesc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Lvls"));
    ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    levelsDesc.putReference(charIDToTypeID("null"), ref);
    
    var levelAdjustDesc = new ActionDescriptor();
    levelAdjustDesc.putInteger(charIDToTypeID("Adjs"), 1);
    
    // Input Levels: [preto, meio-tom, branco]
    // Arrastar esquerda para direita = mais halftone
    // Arrastar direita para esquerda = menos halftone
    var inputLevels = new ActionList();
    inputLevels.putInteger(30);  // Preto (slider esquerdo movido para direita)
    inputLevels.putInteger(128); // Meio-tom (centro)
    inputLevels.putInteger(220); // Branco (slider direito movido para esquerda)
    levelAdjustDesc.putList(charIDToTypeID("Inpt"), inputLevels);
    
    var outputLevels = new ActionList();
    outputLevels.putInteger(0);
    outputLevels.putInteger(255);
    levelAdjustDesc.putList(charIDToTypeID("Outp"), outputLevels);
    
    levelsDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lvls"), levelAdjustDesc);
    executeAction(charIDToTypeID("setd"), levelsDesc, DialogModes.NO);
    
    // PASSO 3: Converter para Bitmap Mode com Halftone Screen
    var bitmapDesc = new ActionDescriptor();
    
    // Resolution: input/2 (se input é 300dpi, output é 150dpi)
    var currentResolution = doc.resolution;
    var outputResolution = currentResolution / 2;
    bitmapDesc.putUnitDouble(charIDToTypeID("Rslt"), charIDToTypeID("#Rsl"), outputResolution);
    
    // Method: Halftone Screen
    bitmapDesc.putEnumerated(charIDToTypeID("Mthd"), charIDToTypeID("Mthd"), charIDToTypeID("HlfT"));
    
    // Frequency: 24-30 LPI (linhas por polegada)
    // Quanto menor o número, maior o ponto
    bitmapDesc.putInteger(charIDToTypeID("Fqnc"), 28); // 28 LPI (bom para DTF)
    
    // Angle: 45 graus (padrão)
    bitmapDesc.putInteger(charIDToTypeID("Angl"), 45);
    
    // Shape: Round (pontos redondos)
    bitmapDesc.putEnumerated(charIDToTypeID("Shp "), charIDToTypeID("Shp "), charIDToTypeID("Rnd "));
    
    executeAction(charIDToTypeID("CnvM"), bitmapDesc, DialogModes.NO);
    
    // PASSO 4: Converter de volta para Grayscale, depois RGB
    doc.changeMode(ChangeMode.GRAYSCALE);
    doc.changeMode(ChangeMode.RGB);
    
    return "SUCCESS - Halftone DTF aplicado!";
})();
'''
        
        result = ps_app.DoJavaScript(jsx)
        print(f"     📋 Resultado: {result}")
        
        print("\n" + "=" * 70)
        print("✅ HALFTONE DTF APLICADO!")
        print("=" * 70)
        print("\n     👀 OLHE O PHOTOSHOP - DEVE VER OS PONTOS DE HALFTONE!")
        print("\nO que você deve ver:")
        print("- Pontos pretos visíveis (halftone)")
        print("- Áreas brancas onde havia branco")
        print("- Áreas com pontos onde havia cinza")
        print("\nEstá igual ao tutorial/concorrente?")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("TUTORIAL DTF HALFTONE")
    print("=" * 70)
    print("\nBaseado no processo:")
    print("1. Converter para Grayscale")
    print("2. Ajustar Levels (controlar halftone)")
    print("3. Converter para Bitmap com Halftone Screen (24-30 LPI)")
    print("4. Voltar para RGB")
    print("\nEste é o método correto para DTF!")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando estiver pronto...")
    print()
    
    test_dtf_halftone()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

