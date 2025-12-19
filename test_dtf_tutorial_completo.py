"""
DTF Halftone - SEGUINDO O TUTORIAL CORRETO
Processo completo com Smart Object e máscara de camada
"""

import sys
import win32com.client
import pythoncom
import time
import os

def test_dtf_tutorial():
    """Segue o tutorial DTF passo a passo"""
    
    print("=" * 70)
    print("DTF HALFTONE - TUTORIAL COMPLETO")
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
        input("     ⏸️  Pressione ENTER para seguir o tutorial...")
        
        # SEGUIR O TUTORIAL PASSO A PASSO
        print("\n[2] Seguindo o tutorial DTF...")
        jsx = '''
(function() {
    app.displayDialogs = DialogModes.NO;
    var doc = app.activeDocument;
    
    // PASSO 1: Achatar imagem para ter apenas 1 camada
    if (doc.layers.length > 1) {
        doc.flatten();
    }
    
    // PASSO 2: Criar camada de fundo preta (cor da camisa)
    var blackLayerDesc = new ActionDescriptor();
    var blackLayerRef = new ActionReference();
    blackLayerRef.putClass(charIDToTypeID("Lyr "));
    blackLayerDesc.putReference(charIDToTypeID("null"), blackLayerRef);
    
    var fillDesc = new ActionDescriptor();
    fillDesc.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID("Nrml"));
    fillDesc.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), 100);
    
    var colorDesc = new ActionDescriptor();
    colorDesc.putDouble(charIDToTypeID("Rd  "), 0);
    colorDesc.putDouble(charIDToTypeID("Grn "), 0);
    colorDesc.putDouble(charIDToTypeID("Bl  "), 0);
    fillDesc.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), colorDesc);
    
    blackLayerDesc.putObject(charIDToTypeID("Usng"), charIDToTypeID("FlLr"), fillDesc);
    executeAction(charIDToTypeID("Mk  "), blackLayerDesc, DialogModes.NO);
    
    // Mover camada preta para baixo
    var topLayer = doc.layers[0];
    var blackLayer = doc.layers[1];
    blackLayer.move(topLayer, ElementPlacement.PLACEAFTER);
    
    // PASSO 3: Duplicar a camada do topo (gráfico)
    doc.activeLayer = doc.layers[0];
    var duplicateDesc = new ActionDescriptor();
    var duplicateRef = new ActionReference();
    duplicateRef.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    duplicateDesc.putReference(charIDToTypeID("null"), duplicateRef);
    executeAction(charIDToTypeID("Dplc"), duplicateDesc, DialogModes.NO);
    
    // PASSO 4: Converter camada duplicada para Smart Object
    var smartObjectDesc = new ActionDescriptor();
    executeAction(stringIDToTypeID("newPlacedLayer"), smartObjectDesc, DialogModes.NO);
    
    // PASSO 5: Abrir Smart Object para editar
    var editDesc = new ActionDescriptor();
    executeAction(stringIDToTypeID("placedLayerEditContents"), editDesc, DialogModes.NO);
    
    // Aguardar Smart Object abrir
    app.refresh();
    
    // Agora estamos dentro do Smart Object
    var smartDoc = app.activeDocument;
    
    // PASSO 6: Converter para Grayscale
    if (smartDoc.mode !== DocumentMode.GRAYSCALE) {
        smartDoc.changeMode(ChangeMode.GRAYSCALE);
    }
    
    // PASSO 7: Ajustar Levels (mover sliders)
    // Este é o passo crucial que controla o que vira halftone
    try {
        // Usar Image > Adjustments > Levels via código mais simples
        var currentLayer = smartDoc.activeLayer;
        
        // Aplicar auto-levels primeiro (ajuste automático)
        try {
            executeAction(charIDToTypeID("AtvL"), new ActionDescriptor(), DialogModes.NO);
        } catch (e) {}
    } catch (e) {}
    
    // PASSO 8: Converter para Bitmap com Halftone Screen
    // ESTE É O PASSO MAIS IMPORTANTE!
    try {
        var bitmapDesc = new ActionDescriptor();
        var currentResolution = smartDoc.resolution;
        var outputResolution = currentResolution / 2; // Dividir resolução por 2
        
        bitmapDesc.putUnitDouble(charIDToTypeID("Rslt"), charIDToTypeID("#Rsl"), outputResolution);
        bitmapDesc.putEnumerated(charIDToTypeID("Mthd"), charIDToTypeID("Mthd"), charIDToTypeID("HlfT")); // Halftone Screen
        bitmapDesc.putInteger(charIDToTypeID("Fqnc"), 28); // 28 LPI
        bitmapDesc.putInteger(charIDToTypeID("Angl"), 45); // 45 graus
        bitmapDesc.putEnumerated(charIDToTypeID("Shp "), charIDToTypeID("Shp "), charIDToTypeID("Rnd ")); // Round
        
        executeAction(charIDToTypeID("CnvM"), bitmapDesc, DialogModes.NO);
        
        // Converter de volta para Grayscale e RGB
        smartDoc.changeMode(ChangeMode.GRAYSCALE);
        smartDoc.changeMode(ChangeMode.RGB);
    } catch (e) {
        // Se Bitmap falhar, usar Color Halftone como alternativa
        try {
            if (smartDoc.mode !== DocumentMode.RGB) {
                smartDoc.changeMode(ChangeMode.RGB);
            }
            var halftoneDesc = new ActionDescriptor();
            halftoneDesc.putInteger(charIDToTypeID("Mxm "), 4);
            halftoneDesc.putInteger(charIDToTypeID("Chn1"), 108);
            halftoneDesc.putInteger(charIDToTypeID("Chn2"), 162);
            halftoneDesc.putInteger(charIDToTypeID("Chn3"), 90);
            halftoneDesc.putInteger(charIDToTypeID("Chn4"), 45);
            executeAction(charIDToTypeID("ClrH"), halftoneDesc, DialogModes.NO);
        } catch (e2) {}
    }
    
    // PASSO 9: Salvar e fechar Smart Object (CTRL+S)
    smartDoc.save();
    smartDoc.close(SaveOptions.SAVECHANGES);
    
    // Agora voltamos ao documento principal
    // O Smart Object agora contém o halftone
    
    return "SUCCESS - Tutorial completo! Agora você tem: camada com halftone, camada original, e camada preta de fundo.";
})();
'''
        
        result = ps_app.DoJavaScript(jsx)
        print(f"     📋 Resultado: {result}")
        
        print("\n" + "=" * 70)
        print("✅ TUTORIAL APLICADO!")
        print("=" * 70)
        print("\n     👀 OLHE O PHOTOSHOP AGORA!")
        print("\nVocê deve ter:")
        print("  • Camada com halftone (Smart Object no topo)")
        print("  • Camada original (no meio)")
        print("  • Camada preta de fundo (embaixo)")
        print("\nPróximos passos MANUAIS:")
        print("  1. Selecione a camada halftone com Marquee (CTRL+A)")
        print("  2. Copie (CTRL+C)")
        print("  3. Oculte a camada halftone")
        print("  4. Selecione a camada original")
        print("  5. Crie máscara de camada")
        print("  6. ALT+Click na máscara")
        print("  7. Cole (CTRL+V)")
        print("\n🎯 Resultado: cor original com efeito halftone!")
        
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
    print("DTF HALFTONE - SEGUINDO O TUTORIAL CORRETO")
    print("=" * 70)
    print("\nEste script segue o tutorial passo a passo:")
    print("  1. Criar camada preta de fundo")
    print("  2. Duplicar camada gráfica")
    print("  3. Converter para Smart Object")
    print("  4. Editar Smart Object (Grayscale > Bitmap Halftone)")
    print("  5. Salvar e voltar")
    print("\nDepois você aplica como máscara manualmente.")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando estiver pronto...")
    print()
    
    test_dtf_tutorial()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

