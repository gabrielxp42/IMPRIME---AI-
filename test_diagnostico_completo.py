"""
Script de diagnóstico completo para entender o que está acontecendo
Compara nosso processamento com o que deveria ser
"""

import sys
import win32com.client
import pythoncom
import time
import os

def test_step_by_step():
    """Testa cada operação individualmente para ver o que funciona"""
    
    print("=" * 70)
    print("DIAGNÓSTICO COMPLETO - Teste Passo a Passo")
    print("=" * 70)
    print()
    
    pythoncom.CoInitialize()
    
    try:
        # Conectar ao Photoshop
        print("[1] Conectando ao Photoshop...")
        ps_app = win32com.client.Dispatch("Photoshop.Application")
        print(f"     ✅ Photoshop: {ps_app.Name}")
        
        # Verificar documento
        if ps_app.Documents.Count == 0:
            print("     ❌ Nenhum documento aberto!")
            return False
        
        doc = ps_app.ActiveDocument
        print(f"     ✅ Documento: {doc.Name}")
        print(f"     📐 Dimensões: {int(doc.Width)} x {int(doc.Height)}")
        print(f"     🎨 Modo: {doc.Mode}")
        
        # TESTE 1: Verificar estado inicial
        print("\n[TESTE 1] Estado inicial do documento")
        print("     👀 OLHE O PHOTOSHOP AGORA - anote como está")
        input("     ⏸️  Pressione ENTER após verificar...")
        
        # TESTE 2: Apenas Selective Color (remover preto)
        print("\n[TESTE 2] Aplicando apenas Selective Color (remover preto)...")
        jsx1 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}
var desc = new ActionDescriptor();
desc.putEnumerated(charIDToTypeID("Clrs"), charIDToTypeID("Clrs"), charIDToTypeID("Blck"));
desc.putDouble(charIDToTypeID("Blck"), -80);
desc.putDouble(charIDToTypeID("Whts"), 0);
desc.putDouble(charIDToTypeID("Mntn"), 0);
desc.putDouble(charIDToTypeID("Ntrl"), 0);
executeAction(charIDToTypeID("SlcC"), desc, DialogModes.NO);
"SUCCESS";
'''
        result1 = ps_app.DoJavaScript(jsx1)
        print(f"     📋 Resultado: {result1}")
        print("     👀 OLHE O PHOTOSHOP - mudou alguma coisa?")
        input("     ⏸️  Pressione ENTER para continuar...")
        
        # TESTE 3: Apenas Brightness/Contrast (método alternativo)
        print("\n[TESTE 3] Aplicando apenas Brightness/Contrast (método alternativo)...")
        jsx2 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;
// Método alternativo: usar Levels para ajustar brilho/contraste
var desc = new ActionDescriptor();
var ref = new ActionReference();
ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Lvls"));
ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
desc.putReference(charIDToTypeID("null"), ref);
var levelDesc = new ActionDescriptor();
levelDesc.putInteger(charIDToTypeID("Adjs"), 1);
levelDesc.putInteger(charIDToTypeID("Achv"), 0);
var inputLevels = new ActionList();
inputLevels.putInteger(0);
inputLevels.putInteger(128);
inputLevels.putInteger(255);
levelDesc.putList(charIDToTypeID("Inpt"), inputLevels);
var outputLevels = new ActionList();
outputLevels.putInteger(0);
outputLevels.putInteger(255);
levelDesc.putList(charIDToTypeID("Outp"), outputLevels);
desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lvls"), levelDesc);
executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
"SUCCESS";
'''
        try:
            result2 = ps_app.DoJavaScript(jsx2)
            print(f"     📋 Resultado: {result2}")
        except Exception as e:
            print(f"     ⚠ Método Levels falhou: {str(e)[:100]}")
            # Tentar método mais simples: aplicar filtro
            print("     Tentando método mais simples...")
            jsx2b = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;
// Aplicar ajuste de Curves (mais compatível)
var desc = new ActionDescriptor();
desc.putEnumerated(charIDToTypeID("PresetKind"), charIDToTypeID("PrsK"), charIDToTypeID("PrsKNone"));
executeAction(charIDToTypeID("Crvs"), desc, DialogModes.NO);
"SUCCESS";
'''
            try:
                result2 = ps_app.DoJavaScript(jsx2b)
                print(f"     📋 Resultado (Curves): {result2}")
            except:
                print("     ⚠ Brightness/Contrast não disponível nesta versão")
                result2 = "SKIPPED"
        print("     👀 OLHE O PHOTOSHOP - mudou alguma coisa?")
        input("     ⏸️  Pressione ENTER para continuar...")
        
        # TESTE 4: Apenas IndexedColor
        print("\n[TESTE 4] Aplicando apenas IndexedColor (halftone)...")
        jsx3 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}
var indexedOptions = new IndexedConversionOptions();
indexedOptions.palette = Palette.LOCALADAPTIVE;
indexedOptions.colors = 256;
indexedOptions.dither = Dither.DIFFUSION;
indexedOptions.ditherAmount = 90;
doc.changeMode(ChangeMode.INDEXEDCOLOR, indexedOptions);
doc.changeMode(ChangeMode.RGB);
"SUCCESS";
'''
        result3 = ps_app.DoJavaScript(jsx3)
        print(f"     📋 Resultado: {result3}")
        print("     👀 OLHE O PHOTOSHOP - O HALFTONE APARECEU?")
        input("     ⏸️  Pressione ENTER para continuar...")
        
        # TESTE 5: Verificar se há camadas
        print("\n[TESTE 5] Verificando estrutura do documento...")
        jsx4 = '''
var doc = app.activeDocument;
var info = "Camadas: " + doc.layers.length + "\\n";
info += "Camada ativa: " + doc.activeLayer.name + "\\n";
info += "Modo: " + doc.mode + "\\n";
info += "Tem canal alfa: " + (doc.channels.length > 3);
info;
'''
        result4 = ps_app.DoJavaScript(jsx4)
        print(f"     📋 Informações:\n{result4}")
        
        # TESTE 6: Tentar aplicar como ajuste de camada
        print("\n[TESTE 6] Tentando aplicar como ajuste de camada...")
        jsx5 = '''
app.displayDialogs = DialogModes.NO;
var doc = app.activeDocument;
if (doc.mode !== DocumentMode.RGB) {
    doc.changeMode(ChangeMode.RGB);
}
// Criar ajuste de camada Selective Color
var desc = new ActionDescriptor();
desc.putClass(charIDToTypeID("Nw  "), charIDToTypeID("AdjL"));
desc.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("Type"), charIDToTypeID("SlcC"));
var ref = new ActionReference();
ref.putClass(charIDToTypeID("AdjL"));
desc.putReference(charIDToTypeID("At  "), ref);
executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
"SUCCESS";
'''
        try:
            result5 = ps_app.DoJavaScript(jsx5)
            print(f"     📋 Resultado: {result5}")
            print("     👀 OLHE O PHOTOSHOP - apareceu uma camada de ajuste?")
        except Exception as e:
            print(f"     ❌ Erro: {str(e)}")
        
        input("     ⏸️  Pressione ENTER para continuar...")
        
        print("\n" + "=" * 70)
        print("DIAGNÓSTICO CONCLUÍDO")
        print("=" * 70)
        print("\nPor favor, me diga:")
        print("1. Qual teste mudou algo visível?")
        print("2. O halftone apareceu no TESTE 4?")
        print("3. O que você viu no Photoshop em cada etapa?")
        
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
    print("2. Abra um arquivo de imagem")
    print("3. Execute este script")
    print("4. Observe cada etapa e me diga o que aconteceu")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando o arquivo estiver aberto...")
    print()
    
    test_step_by_step()

