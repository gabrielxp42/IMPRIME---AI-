"""
Teste de diferentes métodos de halftone para ver qual cria o efeito visível
"""

import sys
import win32com.client
import pythoncom
import time

def test_halftone_methods():
    """Testa diferentes métodos de halftone"""
    
    print("=" * 70)
    print("TESTE DE MÉTODOS DE HALFTONE")
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
        
        # MÉTODO 1: Color Halftone (Filter > Pixelate > Color Halftone)
        print("\n[MÉTODO 1] Color Halftone (filtro de pixelização)...")
        jsx1 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;

// Garantir RGB
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}

// Aplicar Color Halftone filter
var desc = new ActionDescriptor();
desc.putInteger(charIDToTypeID("Mxm "), 8); // Max Radius (pixels)
desc.putInteger(charIDToTypeID("Chn1"), 108); // Channel 1 (Cyan angle)
desc.putInteger(charIDToTypeID("Chn2"), 162); // Channel 2 (Magenta angle)
desc.putInteger(charIDToTypeID("Chn3"), 90);  // Channel 3 (Yellow angle)
desc.putInteger(charIDToTypeID("Chn4"), 45);  // Channel 4 (Black angle)
executeAction(charIDToTypeID("ClrH"), desc, DialogModes.NO);

"SUCCESS";
'''
        try:
            result1 = ps_app.DoJavaScript(jsx1)
            print(f"     📋 Resultado: {result1}")
            print("     👀 OLHE O PHOTOSHOP - APARECEU O HALFTONE (PONTOS)?")
            input("     ⏸️  Pressione ENTER para continuar...")
        except Exception as e:
            print(f"     ❌ Erro: {str(e)[:200]}")
            input("     ⏸️  Pressione ENTER para tentar próximo método...")
        
        # MÉTODO 2: Halftone Pattern (Filter > Sketch > Halftone Pattern)
        print("\n[MÉTODO 2] Halftone Pattern (filtro de esboço)...")
        jsx2 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;

// Garantir RGB
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}

// Aplicar Halftone Pattern filter
var desc = new ActionDescriptor();
desc.putInteger(charIDToTypeID("Sz  "), 1); // Size
desc.putInteger(charIDToTypeID("Cntr"), 5); // Contrast
desc.putEnumerated(charIDToTypeID("Ptrn"), charIDToTypeID("Ptrn"), charIDToTypeID("Dt  ")); // Pattern Type (Dot)
executeAction(stringIDToTypeID("halftonePattern"), desc, DialogModes.NO);

"SUCCESS";
'''
        try:
            result2 = ps_app.DoJavaScript(jsx2)
            print(f"     📋 Resultado: {result2}")
            print("     👀 OLHE O PHOTOSHOP - APARECEU O HALFTONE?")
            input("     ⏸️  Pressione ENTER para continuar...")
        except Exception as e:
            print(f"     ❌ Erro: {str(e)[:200]}")
            input("     ⏸️  Pressione ENTER para tentar próximo método...")
        
        # MÉTODO 3: Mezzotint (Filter > Pixelate > Mezzotint)
        print("\n[MÉTODO 3] Mezzotint (efeito de meio-tom)...")
        jsx3 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;

// Garantir RGB
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}

// Aplicar Mezzotint filter
var desc = new ActionDescriptor();
desc.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("Mztn"), charIDToTypeID("MdmD")); // Medium Dots
executeAction(charIDToTypeID("Mztn"), desc, DialogModes.NO);

"SUCCESS";
'''
        try:
            result3 = ps_app.DoJavaScript(jsx3)
            print(f"     📋 Resultado: {result3}")
            print("     👀 OLHE O PHOTOSHOP - APARECEU O EFEITO?")
            input("     ⏸️  Pressione ENTER para continuar...")
        except Exception as e:
            print(f"     ❌ Erro: {str(e)[:200]}")
            input("     ⏸️  Pressione ENTER para continuar...")
        
        # MÉTODO 4: Bitmap Mode (modo bitmap com halftone)
        print("\n[MÉTODO 4] Bitmap Mode (conversão para bitmap com halftone)...")
        jsx4 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;

// Converter para Grayscale primeiro
if (doc.mode !== DocumentMode.GRAYSCALE) {
    doc.changeMode(ChangeMode.GRAYSCALE);
}

// Converter para Bitmap com Halftone Screen
var desc = new ActionDescriptor();
desc.putUnitDouble(charIDToTypeID("Rslt"), charIDToTypeID("#Rsl"), 300); // Resolution
desc.putEnumerated(charIDToTypeID("Mthd"), charIDToTypeID("Mthd"), charIDToTypeID("HlfT")); // Method: Halftone Screen
desc.putInteger(charIDToTypeID("Fqnc"), 30); // Frequency (LPI)
desc.putEnumerated(charIDToTypeID("Angl"), charIDToTypeID("Angl"), charIDToTypeID("Dflt")); // Angle: Default
desc.putEnumerated(charIDToTypeID("Shp "), charIDToTypeID("Shp "), charIDToTypeID("Rnd ")); // Shape: Round
executeAction(charIDToTypeID("CnvM"), desc, DialogModes.NO);

// Converter de volta para RGB
doc.changeMode(ChangeMode.GRAYSCALE);
doc.changeMode(ChangeMode.RGB);

"SUCCESS";
'''
        try:
            result4 = ps_app.DoJavaScript(jsx4)
            print(f"     📋 Resultado: {result4}")
            print("     👀 OLHE O PHOTOSHOP - ESTE DEVE MOSTRAR HALFTONE REAL!")
            input("     ⏸️  Pressione ENTER para continuar...")
        except Exception as e:
            print(f"     ❌ Erro: {str(e)[:200]}")
        
        print("\n" + "=" * 70)
        print("TESTE CONCLUÍDO")
        print("=" * 70)
        print("\nPor favor, me diga:")
        print("1. Qual método mostrou o halftone (pontos visíveis)?")
        print("2. O MÉTODO 4 (Bitmap Mode) funcionou?")
        print("3. Qual método se parece mais com o concorrente?")
        
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
    print("2. Abra um arquivo de imagem (de preferência uma imagem colorida)")
    print("3. Execute este script")
    print("4. Observe cada método e veja qual cria halftone visível")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando o arquivo estiver aberto...")
    print()
    
    test_halftone_methods()
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

