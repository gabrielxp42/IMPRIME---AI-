"""
DTF Halftone - Versão Simplificada (apenas o essencial)
Foca no Bitmap Mode com Halftone Screen
"""

import sys
import win32com.client
import pythoncom
import time

def test_dtf_halftone_simple():
    """Aplica halftone DTF - versão simplificada focada no essencial"""
    
    print("=" * 70)
    print("DTF HALFTONE - VERSÃO SIMPLIFICADA")
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
        input("     ⏸️  Pressione ENTER para aplicar halftone...")
        
        # HALFTONE DTF SIMPLIFICADO (apenas o essencial)
        print("\n[2] Aplicando halftone DTF...")
        jsx = '''
(function() {
    app.displayDialogs = DialogModes.NO;
    var doc = app.activeDocument;
    
    // PASSO 1: Converter para Grayscale
    if (doc.mode !== DocumentMode.GRAYSCALE) {
        doc.changeMode(ChangeMode.GRAYSCALE);
    }
    
    // PASSO 2: Converter para Bitmap Mode com Halftone Screen
    // ESTE É O PASSO CRUCIAL QUE CRIA OS PONTOS!
    var bitmapDesc = new ActionDescriptor();
    
    // Resolution: input/2 (se 300dpi, output 150dpi)
    var currentResolution = doc.resolution;
    var outputResolution = currentResolution / 2;
    bitmapDesc.putUnitDouble(charIDToTypeID("Rslt"), charIDToTypeID("#Rsl"), outputResolution);
    
    // Method: Halftone Screen (CRUCIAL!)
    bitmapDesc.putEnumerated(charIDToTypeID("Mthd"), charIDToTypeID("Mthd"), charIDToTypeID("HlfT"));
    
    // Frequency: 28 LPI (linhas por polegada - cria os pontos)
    bitmapDesc.putInteger(charIDToTypeID("Fqnc"), 28);
    
    // Angle: 45 graus
    bitmapDesc.putInteger(charIDToTypeID("Angl"), 45);
    
    // Shape: Round (pontos redondos)
    bitmapDesc.putEnumerated(charIDToTypeID("Shp "), charIDToTypeID("Shp "), charIDToTypeID("Rnd "));
    
    executeAction(charIDToTypeID("CnvM"), bitmapDesc, DialogModes.NO);
    
    // PASSO 3: Converter de volta para Grayscale, depois RGB
    doc.changeMode(ChangeMode.GRAYSCALE);
    doc.changeMode(ChangeMode.RGB);
    
    return "SUCCESS - Halftone aplicado!";
})();
'''
        
        result = ps_app.DoJavaScript(jsx)
        print(f"     📋 Resultado: {result}")
        
        print("\n" + "=" * 70)
        print("✅ HALFTONE DTF APLICADO!")
        print("=" * 70)
        print("\n     👀 OLHE O PHOTOSHOP AGORA!")
        print("\nVocê DEVE ver:")
        print("  • Pontos pretos de halftone visíveis")
        print("  • Padrão de pontos organizados")
        print("  • Efeito de tela de impressão")
        print("\nSe você vê os pontos, FUNCIONOU! 🎉")
        print("\nSe não funcionou, me diga:")
        print("  1. O que você vê na imagem?")
        print("  2. Mudou alguma coisa?")
        print("  3. Qual é a resolução da imagem original?")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        
        print("\n" + "=" * 70)
        print("DIAGNÓSTICO DO ERRO")
        print("=" * 70)
        if "8800" in str(e) or "não está disponível" in str(e):
            print("\nPROBLEMA: Conversão para Bitmap não disponível")
            print("\nPossíveis causas:")
            print("  1. Imagem está em modo de cor incompatível")
            print("  2. Imagem tem múltiplas camadas")
            print("  3. Imagem tem canais alfa/transparência")
            print("\nSOLUÇÃO: Tente com uma imagem:")
            print("  • Em RGB ou Grayscale")
            print("  • Com apenas 1 camada (achatada)")
            print("  • Sem transparência")
        
        return False
        
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("DTF HALFTONE - TESTE SIMPLIFICADO")
    print("=" * 70)
    print("\nEste teste foca no essencial:")
    print("  1. Grayscale")
    print("  2. Bitmap Mode + Halftone Screen (CRIA OS PONTOS)")
    print("  3. Volta para RGB")
    print("\nPREPARE A IMAGEM:")
    print("  • Achate todas as camadas (Layer > Flatten Image)")
    print("  • Certifique-se que está em RGB/Grayscale")
    print("  • Remova transparências se houver")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando estiver pronto...")
    print()
    
    test_dtf_halftone_simple()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

