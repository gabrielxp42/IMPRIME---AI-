"""
Teste focado em REMOVER COR ESCURA (preparação para impressão)
Baseado no que "AUTO COR ESCURA GENÉRICO" deve fazer
"""

import sys
import win32com.client
import pythoncom
import time

def test_remove_dark_color():
    """Testa remoção de cores escuras (pretas) de forma agressiva"""
    
    print("=" * 70)
    print("TESTE: REMOVER COR ESCURA (preparação para impressão)")
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
        print("\n     👀 OLHE A IMAGEM ORIGINAL AGORA")
        input("     ⏸️  Pressione ENTER para processar...")
        
        # PROCESSAMENTO COMPLETO "AUTO COR ESCURA"
        print("\n[2] Aplicando processamento completo...")
        jsx = '''
(function() {
    app.displayDialogs = DialogModes.NO;
    var doc = app.activeDocument;
    
    // 1. Garantir RGB
    if (doc.mode !== DocumentMode.RGB) {
        doc.changeMode(ChangeMode.RGB);
    }
    
    // 2. REMOVER CORES ESCURAS usando Color Range + Delete
    try {
        // Selecionar cores escuras (pretas e cinzas escuros)
        var desc = new ActionDescriptor();
        desc.putEnumerated(charIDToTypeID("Mthd"), charIDToTypeID("ClrR"), charIDToTypeID("Smpd")); // Sampled Colors
        desc.putInteger(charIDToTypeID("Fzns"), 40); // Fuzziness (tolerância)
        desc.putInteger(charIDToTypeID("Mnm "), 0);   // Minimum range
        desc.putInteger(charIDToTypeID("Mxm "), 50);  // Maximum range (apenas tons escuros)
        executeAction(charIDToTypeID("ClrR"), desc, DialogModes.NO);
        
        // Deletar pixels selecionados (criar transparência)
        if (doc.selection.bounds && doc.selection.bounds.length > 0) {
            doc.selection.clear();
            doc.selection.deselect();
        }
    } catch (e) {
        // Método alternativo: Selective Color agressivo
        try {
            var selectiveDesc = new ActionDescriptor();
            selectiveDesc.putEnumerated(charIDToTypeID("Clrs"), charIDToTypeID("Clrs"), charIDToTypeID("Blck"));
            selectiveDesc.putDouble(charIDToTypeID("Blck"), -100); // Remover 100% do preto
            executeAction(charIDToTypeID("SlcC"), selectiveDesc, DialogModes.NO);
        } catch (e2) {}
    }
    
    // 3. CLAREAR a imagem (aumentar exposição)
    try {
        // Usar Exposure adjustment
        var exposureDesc = new ActionDescriptor();
        exposureDesc.putDouble(charIDToTypeID("Expsr"), 0.5); // Aumentar exposição
        exposureDesc.putDouble(charIDToTypeID("Ofst"), 0.02); // Offset
        exposureDesc.putDouble(charIDToTypeID("gama"), 1.0);  // Gamma
        executeAction(charIDToTypeID("Expsr"), exposureDesc, DialogModes.NO);
    } catch (e) {}
    
    // 4. AUMENTAR SATURAÇÃO (cores mais vivas)
    try {
        var hueSatDesc = new ActionDescriptor();
        hueSatDesc.putBoolean(charIDToTypeID("Clrz"), false);
        var adjustmentDesc = new ActionDescriptor();
        adjustmentDesc.putInteger(charIDToTypeID("H   "), 0);
        adjustmentDesc.putInteger(charIDToTypeID("Strt"), 20); // Saturação +20
        adjustmentDesc.putInteger(charIDToTypeID("Lght"), 0);
        var adjustmentList = new ActionList();
        adjustmentList.putObject(charIDToTypeID("Hst2"), adjustmentDesc);
        hueSatDesc.putList(charIDToTypeID("Adjs"), adjustmentList);
        executeAction(charIDToTypeID("Hst2"), hueSatDesc, DialogModes.NO);
    } catch (e) {}
    
    // 5. APLICAR Color Halftone (efeito visual de halftone)
    try {
        var halftoneDesc = new ActionDescriptor();
        halftoneDesc.putInteger(charIDToTypeID("Mxm "), 4); // Radius pequeno (4 pixels)
        halftoneDesc.putInteger(charIDToTypeID("Chn1"), 108);
        halftoneDesc.putInteger(charIDToTypeID("Chn2"), 162);
        halftoneDesc.putInteger(charIDToTypeID("Chn3"), 90);
        halftoneDesc.putInteger(charIDToTypeID("Chn4"), 45);
        executeAction(charIDToTypeID("ClrH"), halftoneDesc, DialogModes.NO);
    } catch (e) {}
    
    return "SUCCESS";
})();
'''
        
        result = ps_app.DoJavaScript(jsx)
        print(f"     📋 Resultado: {result}")
        
        print("\n" + "=" * 70)
        print("✅ PROCESSAMENTO CONCLUÍDO!")
        print("=" * 70)
        print("\n     👀 OLHE O PHOTOSHOP AGORA")
        print("\nO que mudou?")
        print("1. As cores escuras (pretas) foram removidas?")
        print("2. A imagem ficou mais clara?")
        print("3. As cores ficaram mais vivas?")
        print("4. Apareceu algum efeito de halftone (pontos)?")
        print("5. Ficou parecido com o concorrente?")
        
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
    print("INSTRUÇÕES:")
    print("1. Abra o Photoshop")
    print("2. Abra uma imagem COM CORES ESCURAS (pretas/cinzas)")
    print("3. Execute este script")
    print("4. Compare o resultado com o concorrente")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando estiver pronto...")
    print()
    
    test_remove_dark_color()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

