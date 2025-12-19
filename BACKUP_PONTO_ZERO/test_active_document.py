"""
Script de teste para validar processamento direto no documento ativo do Photoshop
Este script testa se as funções funcionam corretamente com arquivo aberto no Photoshop
"""

import sys
import win32com.client
import pythoncom
import time
import os
from pathlib import Path

def test_active_document_processing():
    """Testa processamento direto no documento ativo"""
    
    print("=" * 60)
    print("TESTE: Processamento Direto no Documento Ativo do Photoshop")
    print("=" * 60)
    print()
    
    # Inicializar COM
    pythoncom.CoInitialize()
    
    try:
        # Conectar ao Photoshop
        print("[1/6] Conectando ao Photoshop...")
        ps_app = None
        for attempt in range(3):
            try:
                ps_app = win32com.client.Dispatch("Photoshop.Application")
                _ = ps_app.Name
                print(f"     ✓ Photoshop conectado: {ps_app.Name}")
                break
            except Exception as e:
                if attempt < 2:
                    time.sleep(1)
                    continue
                else:
                    raise Exception(f"Não foi possível conectar ao Photoshop: {str(e)}")
        
        if ps_app is None:
            print("     ❌ ERRO: Não foi possível conectar ao Photoshop")
            return False
        
        # Verificar se há documentos abertos
        print("\n[2/6] Verificando documentos abertos...")
        try:
            doc_count = ps_app.Documents.Count
            print(f"     Documentos abertos: {doc_count}")
            
            if doc_count == 0:
                print("     ❌ ERRO: Nenhum documento aberto no Photoshop!")
                print("     Por favor, abra um arquivo no Photoshop primeiro.")
                return False
            
            print("     ✓ Documento(s) encontrado(s)")
        except Exception as e:
            print(f"     ❌ ERRO ao verificar documentos: {str(e)}")
            return False
        
        # Obter documento ativo
        print("\n[3/6] Obtendo documento ativo...")
        try:
            doc = ps_app.ActiveDocument
            if doc is None:
                print("     ❌ ERRO: ActiveDocument retornou None")
                return False
            
            doc_name = doc.Name
            print(f"     ✓ Documento ativo: {doc_name}")
            
            # Tentar obter caminho
            try:
                full_name = doc.FullName
                if full_name:
                    doc_path = full_name.fsName
                    print(f"     ✓ Caminho: {doc_path}")
                else:
                    print("     ⚠ Documento não salvo (sem caminho)")
            except:
                print("     ⚠ Documento não salvo (sem caminho)")
            
            # Informações do documento
            try:
                width = doc.Width
                height = doc.Height
                mode = doc.Mode
                print(f"     ✓ Dimensões: {width} x {height} pixels")
                print(f"     ✓ Modo: {mode}")
            except Exception as e:
                print(f"     ⚠ Não foi possível obter todas as informações: {str(e)}")
                
        except Exception as e:
            print(f"     ❌ ERRO ao obter documento ativo: {str(e)}")
            return False
        
        # Criar diretório de teste
        print("\n[4/6] Preparando diretório de teste...")
        test_dir = os.path.join(os.path.expanduser("~"), "Desktop", "test_photoshop_automation")
        os.makedirs(test_dir, exist_ok=True)
        print(f"     ✓ Diretório de teste: {test_dir}")
        
        # Gerar nome do arquivo de saída
        timestamp = int(time.time())
        output_file = os.path.join(test_dir, f"test_halftone_{timestamp}.tiff")
        print(f"     ✓ Arquivo de saída: {output_file}")
        
        # Testar processamento JSX diretamente no documento ativo
        print("\n[5/6] Testando processamento JSX no documento ativo...")
        print("     (Simulando o que o código TypeScript faria)")
        
        # Script JSX de teste (processamento Indexed Color simples)
        jsx_script = f'''
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
        
        // Aplicar halftone pattern usando Indexed Color (teste simples)
        var indexedOptions = new IndexedConversionOptions();
        indexedOptions.palette = Palette.LOCALADAPTIVE;
        indexedOptions.colors = 256;
        indexedOptions.dither = Dither.DIFFUSION;
        indexedOptions.ditherAmount = 50;
        
        // Converter para Indexed Color
        doc.changeMode(ChangeMode.INDEXEDCOLOR, indexedOptions);
        
        // Converter de volta para RGB
        doc.changeMode(ChangeMode.RGB);
        
        // Salvar como TIFF
        var outputFile = new File("{output_file.replace(chr(92), '/')}");
        var outputFolder = outputFile.parent;
        if (!outputFolder.exists) {{
            outputFolder.create();
        }}
        
        var tiffOptions = new TiffSaveOptions();
        tiffOptions.transparency = true;
        tiffOptions.compression = TIFFEncoding.NONE;
        
        doc.saveAs(outputFile, tiffOptions);
        // Não fechar documento ativo, apenas salvar
        
        return "SUCCESS";
    }} catch (error) {{
        return "ERROR:" + error.toString();
    }}
}})();
'''
        
        # Salvar script JSX temporário
        temp_jsx = os.path.join(test_dir, f"test_script_{timestamp}.jsx")
        with open(temp_jsx, 'w', encoding='utf-8') as f:
            f.write(jsx_script)
        print(f"     ✓ Script JSX criado: {temp_jsx}")
        
        # Executar via DoJavaScript
        try:
            print("     Executando script JSX...")
            result = ps_app.DoJavaScript(jsx_script)
            print(f"     Resultado: {result}")
            
            # Aguardar um pouco para o arquivo ser salvo
            time.sleep(2)
            
            # Verificar se arquivo foi criado
            if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                file_size = os.path.getsize(output_file)
                print(f"     ✓ Arquivo de saída criado com sucesso!")
                print(f"     ✓ Tamanho: {file_size:,} bytes")
            else:
                print(f"     ⚠ Arquivo de saída não encontrado ou vazio")
                print(f"     Aguardando mais 3 segundos...")
                time.sleep(3)
                if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                    file_size = os.path.getsize(output_file)
                    print(f"     ✓ Arquivo criado após espera!")
                    print(f"     ✓ Tamanho: {file_size:,} bytes")
                else:
                    print(f"     ❌ Arquivo ainda não foi criado")
                    return False
            
        except Exception as e:
            print(f"     ❌ ERRO ao executar script JSX: {str(e)}")
            return False
        
        # Verificar documento ainda está aberto
        print("\n[6/6] Verificando estado final...")
        try:
            final_doc_count = ps_app.Documents.Count
            if final_doc_count > 0:
                final_doc = ps_app.ActiveDocument
                print(f"     ✓ Documento ainda está aberto: {final_doc.Name}")
                print(f"     ✓ Total de documentos: {final_doc_count}")
            else:
                print(f"     ⚠ Nenhum documento aberto (pode ter sido fechado)")
        except Exception as e:
            print(f"     ⚠ Erro ao verificar estado: {str(e)}")
        
        # Limpar arquivo temporário
        try:
            if os.path.exists(temp_jsx):
                os.remove(temp_jsx)
        except:
            pass
        
        print("\n" + "=" * 60)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        print(f"\nArquivo de teste salvo em: {output_file}")
        print("\nO processamento direto no documento ativo está funcionando!")
        
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
    print("\n" + "=" * 60)
    print("INSTRUÇÕES:")
    print("1. Abra o Photoshop")
    print("2. Abra qualquer arquivo de imagem (PNG, JPG, TIFF, etc.)")
    print("3. Execute este script: python test_active_document.py")
    print("=" * 60)
    print()
    
    input("Pressione ENTER quando o arquivo estiver aberto no Photoshop...")
    print()
    
    success = test_active_document_processing()
    
    if success:
        print("\n✅ Todos os testes passaram!")
        sys.exit(0)
    else:
        print("\n❌ Alguns testes falharam. Verifique os erros acima.")
        sys.exit(1)

