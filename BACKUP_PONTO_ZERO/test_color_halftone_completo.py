"""
Teste usando Color Halftone (que funcionou) + preparação para impressão
Este deve ser o método que o concorrente usa
"""

import sys
import win32com.client
import pythoncom
import time

def test_color_halftone_complete():
    """Aplica Color Halftone + preparação completa"""
    
    print("=" * 70)
    print("HALFTONE COMPLETO - Color Halftone + Preparação")
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
        print(f"     📐 Resolução: {int(doc.Resolution)} DPI")
        print("\n     👀 OLHE A IMAGEM ORIGINAL")
        input("     ⏸️  Pressione ENTER para processar...")
        
        # PROCESSAMENTO COMPLETO
        print("\n[2] Aplicando processamento completo...")
        jsx = '''
(function() {
    app.displayDialogs = DialogModes.NO;
    var doc = app.activeDocument;
    
    // Garantir RGB
    if (doc.mode !== DocumentMode.RGB) {
        doc.changeMode(ChangeMode.RGB);
    }
    
    // ETAPA 1: REMOVER CORES ESCURAS (preparação)
    // Usar Selective Color para reduzir pretos
    try {
        var selectiveDesc = new ActionDescriptor();
        selectiveDesc.putEnumerated(charIDToTypeID("Clrs"), charIDToTypeID("Clrs"), charIDToTypeID("Blck"));
        selectiveDesc.putDouble(charIDToTypeID("Blck"), -70); // Reduzir 70% do preto
        executeAction(charIDToTypeID("SlcC"), selectiveDesc, DialogModes.NO);
    } catch (e) {}
    
    // ETAPA 2: APLICAR COLOR HALFTONE (cria os pontos)
    try {
        var halftoneDesc = new ActionDescriptor();
        halftoneDesc.putInteger(charIDToTypeID("Mxm "), 8); // Max Radius (tamanho dos pontos)
        halftoneDesc.putInteger(charIDToTypeID("Chn1"), 108); // Cyan angle
        halftoneDesc.putInteger(charIDToTypeID("Chn2"), 162); // Magenta angle
        halftoneDesc.putInteger(charIDToTypeID("Chn3"), 90);  // Yellow angle
        halftoneDesc.putInteger(charIDToTypeID("Chn4"), 45);  // Black angle
        executeAction(charIDToTypeID("ClrH"), halftoneDesc, DialogModes.NO);
    } catch (e) {
        return "ERROR: Color Halftone falhou - " + e.toString();
    }
    
    // ETAPA 3: AJUSTAR SATURAÇÃO (cores mais vivas)
    try {
        var hueSatDesc = new ActionDescriptor();
        hueSatDesc.putBoolean(charIDToTypeID("Clrz"), false);
        var adjustmentDesc = new ActionDescriptor();
        adjustmentDesc.putInteger(charIDToTypeID("H   "), 0);
        adjustmentDesc.putInteger(charIDToTypeID("Strt"), 15); // Saturação +15
        adjustmentDesc.putInteger(charIDToTypeID("Lght"), 0);
        var adjustmentList = new ActionList();
        adjustmentList.putObject(charIDToTypeID("Hst2"), adjustmentDesc);
        hueSatDesc.putList(charIDToTypeID("Adjs"), adjustmentList);
        executeAction(charIDToTypeID("Hst2"), hueSatDesc, DialogModes.NO);
    } catch (e) {}
    
    // ETAPA 4: APLICAR NITIDEZ
    try {
        var unsharpDesc = new ActionDescriptor();
        unsharpDesc.putUnitDouble(charIDToTypeID("Amnt"), charIDToTypeID("#Prc"), 50); // 50%
        unsharpDesc.putUnitDouble(charIDToTypeID("Rds "), charIDToTypeID("#Pxl"), 1.0); // 1.0 pixel
        unsharpDesc.putInteger(charIDToTypeID("Thsh"), 0); // Threshold 0
        executeAction(charIDToTypeID("UnsM"), unsharpDesc, DialogModes.NO);
    } catch (e) {}
    
    return "SUCCESS - Processamento completo aplicado!";
})();
'''
        
        result = ps_app.DoJavaScript(jsx)
        print(f"     📋 Resultado: {result}")
        
        if "SUCCESS" in str(result):
            print("\n" + "=" * 70)
            print("✅ PROCESSAMENTO COMPLETO APLICADO!")
            print("=" * 70)
            print("\n     👀 OLHE O PHOTOSHOP AGORA!")
            print("\nVocê DEVE ver:")
            print("  • Pontos de halftone CMYK coloridos")
            print("  • Cores menos escuras (pretos removidos)")
            print("  • Cores mais vivas (saturação aumentada)")
            print("  • Imagem mais nítida")
            print("\n🎯 Este deve ser o resultado igual ao concorrente!")
            print("\nFuncionou como esperado?")
        else:
            print("\n     ⚠ Processamento completou mas com avisos")
        
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
    print("HALFTONE COMPLETO PARA DTF/DTG")
    print("=" * 70)
    print("\nEste método usa:")
    print("  1. Selective Color - remove cores escuras")
    print("  2. Color Halftone - cria os pontos (FUNCIONA!)")
    print("  3. Hue/Saturation - cores mais vivas")
    print("  4. Unsharp Mask - nitidez")
    print("\nEste deve ser o método que o concorrente usa!")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando estiver pronto...")
    print()
    
    test_color_halftone_complete()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

