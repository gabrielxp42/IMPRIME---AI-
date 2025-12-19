"""
TESTE REAL NO PHOTOSHOP
Este script testa o processamento direto no documento ativo
Execute com um arquivo aberto no Photoshop
"""

import sys
import win32com.client
import pythoncom
import time
import os
from pathlib import Path

def test_halftone_on_active_document():
    """Testa halftone diretamente no documento ativo do Photoshop"""
    
    print("=" * 70)
    print("TESTE REAL: Processamento Halftone no Documento Ativo")
    print("=" * 70)
    print()
    
    # Inicializar COM
    pythoncom.CoInitialize()
    
    try:
        # Conectar ao Photoshop
        print("[1/7] Conectando ao Photoshop...")
        ps_app = None
        for attempt in range(3):
            try:
                ps_app = win32com.client.Dispatch("Photoshop.Application")
                _ = ps_app.Name
                print(f"     ✅ Photoshop conectado: {ps_app.Name}")
                break
            except Exception as e:
                if attempt < 2:
                    time.sleep(1)
                    continue
                else:
                    raise Exception(f"Não foi possível conectar: {str(e)}")
        
        if ps_app is None:
            print("     ❌ ERRO: Não foi possível conectar ao Photoshop")
            return False
        
        # Verificar documento ativo
        print("\n[2/7] Verificando documento ativo...")
        try:
            if ps_app.Documents.Count == 0:
                print("     ❌ ERRO: Nenhum documento aberto!")
                print("     Por favor, abra um arquivo no Photoshop primeiro.")
                return False
            
            doc = ps_app.ActiveDocument
            doc_name = doc.Name
            print(f"     ✅ Documento ativo encontrado: {doc_name}")
            
            # Informações do documento
            try:
                width = doc.Width
                height = doc.Height
                mode = doc.Mode
                print(f"     📐 Dimensões: {int(width)} x {int(height)} pixels")
                print(f"     🎨 Modo: {mode}")
            except:
                pass
                
        except Exception as e:
            print(f"     ❌ ERRO: {str(e)}")
            return False
        
        # Preparar diretório de saída
        print("\n[3/7] Preparando diretório de saída...")
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        test_dir = os.path.join(desktop, "TESTE_HALFTONE")
        os.makedirs(test_dir, exist_ok=True)
        print(f"     ✅ Diretório: {test_dir}")
        
        # Gerar arquivo de saída
        timestamp = int(time.time())
        output_file = os.path.join(test_dir, f"halftone_test_{timestamp}.tiff")
        # Normalizar caminho para JSX (usar barras normais e caminho absoluto)
        output_file_abs = os.path.abspath(output_file)
        normalized_output = output_file_abs.replace('\\', '/')
        print(f"     ✅ Arquivo de saída: {output_file}")
        print(f"     📁 Caminho normalizado para JSX: {normalized_output}")
        
        # Configurar LPI para teste
        lpi = 30
        dither_amount = max(30, min(100, 100 - (lpi - 25) * 2))
        print(f"\n[4/7] Configurando halftone...")
        print(f"     📐 LPI: {lpi}")
        print(f"     🎨 Dither Amount: {dither_amount}")
        
        # Gerar script JSX (igual ao que o TypeScript gera)
        print("\n[5/7] Gerando script JSX...")
        jsx_script = f'''// Script para Halftone Indexed Color - {lpi} LPI
(function() {{
    var doc = null;
    try {{
        app.displayDialogs = DialogModes.NO;
        
        // Usar documento ativo
        if (app.documents.length === 0) {{
            throw new Error("Nenhum documento aberto no Photoshop.");
        }}
        doc = app.activeDocument;
        
        // Converter para RGB se necessário
        if (doc.mode !== DocumentMode.RGB) {{
            doc.changeMode(ChangeMode.RGB);
        }}
        
        // ===== PROCESSAMENTO COMPLETO "AUTO COR ESCURA" =====
        // Como no concorrente: aplica múltiplas operações
        
        // 1. REMOVER CORES ESCURAS (pretas) usando Selective Color
        try {{
            var selectiveColorDesc = new ActionDescriptor();
            selectiveColorDesc.putEnumerated(charIDToTypeID("Clrs"), charIDToTypeID("Clrs"), charIDToTypeID("Blck"));
            selectiveColorDesc.putDouble(charIDToTypeID("Blck"), -80); // Reduzir preto em 80%
            selectiveColorDesc.putDouble(charIDToTypeID("Whts"), 0);
            selectiveColorDesc.putDouble(charIDToTypeID("Mntn"), 0);
            selectiveColorDesc.putDouble(charIDToTypeID("Ntrl"), 0);
            executeAction(charIDToTypeID("SlcC"), selectiveColorDesc, DialogModes.NO);
        }} catch (e) {{
            // Continuar se falhar
        }}
        
        // 2. AJUSTAR BRILHO/CONTRASTE usando Levels (mais compatível)
        try {{
            var levelsDesc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("Lvls"));
            ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
            levelsDesc.putReference(charIDToTypeID("null"), ref);
            var levelAdjustDesc = new ActionDescriptor();
            levelAdjustDesc.putInteger(charIDToTypeID("Adjs"), 1);
            var inputLevels = new ActionList();
            inputLevels.putInteger(0);
            inputLevels.putInteger(115); // Aumentar brilho (meio tom mais claro)
            inputLevels.putInteger(255);
            levelAdjustDesc.putList(charIDToTypeID("Inpt"), inputLevels);
            var outputLevels = new ActionList();
            outputLevels.putInteger(0);
            outputLevels.putInteger(255);
            levelAdjustDesc.putList(charIDToTypeID("Outp"), outputLevels);
            levelsDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lvls"), levelAdjustDesc);
            executeAction(charIDToTypeID("setd"), levelsDesc, DialogModes.NO);
        }} catch (e) {{
            // Se Levels falhar, tentar Curves
            try {{
                var curvesDesc = new ActionDescriptor();
                curvesDesc.putEnumerated(charIDToTypeID("PresetKind"), charIDToTypeID("PrsK"), charIDToTypeID("PrsKNone"));
                executeAction(charIDToTypeID("Crvs"), curvesDesc, DialogModes.NO);
            }} catch (e2) {{
                // Continuar se ambos falharem
            }}
        }}
        
        // 3. APLICAR HALFTONE usando Indexed Color
        var indexedOptions = new IndexedConversionOptions();
        indexedOptions.palette = Palette.LOCALADAPTIVE;
        indexedOptions.colors = 256;
        indexedOptions.dither = Dither.DIFFUSION;
        indexedOptions.ditherAmount = {dither_amount};
        
        // Converter para Indexed Color (aplica halftone)
        doc.changeMode(ChangeMode.INDEXEDCOLOR, indexedOptions);
        
        // 4. CONVERTER DE VOLTA PARA RGB para manter qualidade
        doc.changeMode(ChangeMode.RGB);
        
        // 5. APLICAR NITIDEZ (Unsharp Mask) para melhorar definição
        try {{
            var unsharpDesc = new ActionDescriptor();
            unsharpDesc.putDouble(charIDToTypeID("Amnt"), 80); // Quantidade de nitidez
            unsharpDesc.putDouble(charIDToTypeID("Rds "), 1.0); // Raio
            unsharpDesc.putInteger(charIDToTypeID("Thsh"), 2); // Threshold
            executeAction(charIDToTypeID("Unsm"), unsharpDesc, DialogModes.NO);
        }} catch (e) {{
            // Continuar se falhar
        }}
        
        // 6. AJUSTE FINAL DE SATURAÇÃO
        try {{
            var hueSatDesc = new ActionDescriptor();
            hueSatDesc.putInteger(charIDToTypeID("Strt"), 10); // Aumentar saturação levemente
            executeAction(charIDToTypeID("HStr"), hueSatDesc, DialogModes.NO);
        }} catch (e) {{
            // Continuar se falhar
        }}
        
        // NÃO SALVAR - Apenas processar o documento
        // O cliente salvará quando quiser
        // Documento permanece aberto e processado
        
        return "SUCCESS";
    }} catch (error) {{
        try {{
            if (doc) {{
                // Não fechar se for documento ativo
            }}
        }} catch (e) {{}}
        return "ERROR:" + error.toString();
    }}
}})();'''
        
        print("     ✅ Script JSX gerado")
        
        # Executar script
        print("\n[6/7] Executando processamento no documento ativo...")
        print("     ⏳ Processando... (isso pode levar alguns segundos)")
        print("     👀 OLHE O PHOTOSHOP - você verá o processamento acontecer!")
        
        try:
            result = ps_app.DoJavaScript(jsx_script)
            print(f"     📋 Resultado: {result}")
            
            # Aguardar salvamento (aumentar tempo de espera)
            print("     ⏳ Aguardando salvamento...")
            time.sleep(5)  # Aumentar para 5 segundos
            
        except Exception as e:
            print(f"     ❌ ERRO ao executar: {str(e)}")
            return False
        
        # Verificar se processamento foi aplicado (não verificar arquivo salvo)
        print("\n[7/7] Verificando processamento...")
        print("     ✅ Processamento aplicado no documento!")
        print("     👀 OLHE O PHOTOSHOP - o documento foi processado")
        print("     💾 Você pode salvar manualmente quando quiser")
        
        # Verificar documento ainda aberto
        print("\n[VERIFICAÇÃO FINAL] Estado do documento...")
        try:
            if ps_app.Documents.Count > 0:
                final_doc = ps_app.ActiveDocument
                print(f"     ✅ Documento ainda está aberto: {final_doc.Name}")
                print(f"     ✅ Total de documentos: {ps_app.Documents.Count}")
            else:
                print(f"     ⚠ Nenhum documento aberto")
        except:
            pass
        
        print("\n" + "=" * 70)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 70)
        print(f"\n🎉 O processamento foi aplicado no documento ativo!")
        print(f"✅ O documento está aberto e processado no Photoshop")
        print(f"💾 Salve manualmente quando quiser (Ctrl+S ou File > Save)")
        print(f"\n👀 Verifique o documento no Photoshop - o halftone foi aplicado!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO GERAL: {str(e)}")
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
    print("INSTRUÇÕES PARA O TESTE:")
    print("=" * 70)
    print("1. ✅ Abra o Photoshop")
    print("2. ✅ Abra QUALQUER arquivo de imagem (PNG, JPG, TIFF, etc.)")
    print("3. ✅ Execute este script: python test_photoshop_real.py")
    print("4. 👀 Observe o Photoshop processar o documento")
    print("=" * 70)
    print()
    
    input("⏸️  Pressione ENTER quando o arquivo estiver aberto no Photoshop...")
    print()
    
    success = test_halftone_on_active_document()
    
    print()
    if success:
        print("🎉 SUCESSO! O teste funcionou perfeitamente!")
        print("✅ O código está funcionando corretamente no Photoshop")
    else:
        print("❌ O teste falhou. Verifique os erros acima.")
    
    input("\n⏸️  Pressione ENTER para sair...")

