#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para automação do Photoshop
Testa: abrir arquivo, aplicar ação, salvar como TIFF

USO: python test_photoshop.py
"""

import sys
import os
import time
import win32com.client

# Arquivos de teste
input_file = r"C:\Users\Direct\Downloads\ADR - 12-11\15.png"
output_file = r"C:\Users\Direct\Downloads\ADR - 12-11\15_TEST.tiff"
action_name = "SPOTWHITE-PHOTOSHOP"
action_set = "DTF"

print("=" * 60)
print("TESTE DE AUTOMAÇÃO PHOTOSHOP")
print("=" * 60)
print(f"\n[1/5] Configuração:")
print(f"     Arquivo de entrada: {input_file}")
print(f"     Arquivo de saída: {output_file}")
print(f"     Ação: {action_name}")
print(f"     Conjunto: {action_set}")

# Verificar se o arquivo de entrada existe
if not os.path.exists(input_file):
    print(f"\n❌ ERRO: Arquivo de entrada não encontrado!")
    print(f"   {input_file}")
    print("\nPor favor, verifique se o arquivo existe.")
    input("\nPressione ENTER para sair...")
    sys.exit(1)

print(f"     ✓ Arquivo de entrada encontrado")

try:
    # Criar objeto COM do Photoshop
    print(f"\n[2/5] Conectando ao Photoshop...")
    print("     Aguarde...")
    ps_app = win32com.client.Dispatch("Photoshop.Application")
    
    # Verificar se está acessível
    app_name = ps_app.Name
    print(f"     ✓ Photoshop conectado: {app_name}")
    print(f"     ✓ Versão: {ps_app.Version if hasattr(ps_app, 'Version') else 'N/A'}")
    
    # Tornar o Photoshop visível e trazer para frente
    try:
        ps_app.Visible = True
        print(f"     ✓ Photoshop tornado visível")
    except:
        pass
    
    # Verificar documentos abertos antes
    docs_before = ps_app.Documents.Count
    print(f"     Documentos abertos antes: {docs_before}")
    
    # Abrir arquivo
    print(f"\n[3/5] Abrindo arquivo no Photoshop...")
    print("     Você deve ver o Photoshop abrindo o arquivo agora...")
    print(f"     Caminho completo: {os.path.abspath(input_file)}")
    time.sleep(1)  # Dar tempo para o Photoshop abrir
    
    # Abrir o arquivo
    try:
        # Usar caminho absoluto normalizado
        input_file_abs = os.path.abspath(input_file).replace('/', '\\')
        print(f"     Abrindo: {input_file_abs}")
        doc = ps_app.Open(input_file_abs)
        time.sleep(2)  # Dar mais tempo para o arquivo abrir completamente
    except Exception as e:
        print(f"     ❌ ERRO ao abrir arquivo: {str(e)}")
        raise
    
    # Verificar documentos abertos depois
    docs_after = ps_app.Documents.Count
    print(f"     Documentos abertos depois: {docs_after}")
    
    if docs_after <= docs_before:
        print(f"     ⚠ AVISO: Número de documentos não aumentou!")
        print(f"     O arquivo pode não ter sido aberto corretamente.")
    else:
        print(f"     ✓ Novo documento detectado!")
    
    # Verificar se o documento foi realmente aberto
    if doc is None:
        raise Exception("Documento retornou None após abrir")
    
    # Tentar obter informações do documento
    try:
        doc_name = doc.Name
        print(f"     ✓ Nome do documento: {doc_name}")
    except:
        print(f"     ⚠ Não foi possível obter nome do documento")
    
    try:
        doc_width = doc.Width
        doc_height = doc.Height
        print(f"     ✓ Dimensões: {doc_width} x {doc_height}")
    except:
        pass
    
    # Trazer o documento para frente
    try:
        doc.Activate()
        print(f"     ✓ Documento ativado")
    except:
        pass
    
    # Trazer o Photoshop para frente (usando Windows API)
    try:
        import win32gui
        import win32con
        hwnd = win32gui.FindWindow(None, "Adobe Photoshop")
        if hwnd:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(hwnd)
            print(f"     ✓ Janela do Photoshop trazida para frente")
    except:
        print(f"     ⚠ Não foi possível trazer janela para frente (pode não ser necessário)")
    
    print(f"     ✓ Arquivo aberto com sucesso!")
    print(f"\n     👀 OLHE O PHOTOSHOP AGORA - O ARQUIVO DEVE ESTAR ABERTO!")
    time.sleep(2)  # Dar tempo para o usuário ver
    
    # Executar ação
    print(f"\n[4/5] Executando ação '{action_name}' do conjunto '{action_set}'...")
    print("     Você deve ver a ação sendo executada no Photoshop agora...")
    time.sleep(1)  # Dar tempo antes de executar
    try:
        ps_app.DoAction(action_name, action_set)
        print(f"     ✓ Ação executada com sucesso!")
        time.sleep(2)  # Dar tempo para a ação completar
    except Exception as e:
        print(f"\n❌ ERRO ao executar ação: {str(e)}")
        print(f"   Verifique se:")
        print(f"   - O Photoshop está em execução")
        print(f"   - A ação '{action_name}' existe no conjunto '{action_set}'")
        doc.Close(2)  # Fechar sem salvar
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    # Criar diretório de saída se não existir
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        print(f"     ✓ Diretório criado: {output_dir}")
    
    # Salvar como TIFF - testar diferentes métodos
    print(f"\n[5/5] Salvando como TIFF...")
    print("     Você deve ver o diálogo de salvar (ou salvar automaticamente)...")
    time.sleep(1)
    
    saved = False
    last_error = None
    actual_saved_path = None
    
    # Verificar o caminho completo e normalizar
    output_file_full = os.path.abspath(output_file)
    output_file_normalized = output_file_full.replace('/', '\\')
    print(f"     Caminho completo: {output_file_normalized}")
    
    # Método 1: Com TiffSaveOptions (sem Compression)
    try:
        print("     Tentando método 1: TiffSaveOptions com transparência...")
        tiff_options = win32com.client.Dispatch("Photoshop.TiffSaveOptions")
        tiff_options.Transparency = True
        # Usar caminho normalizado
        doc.SaveAs(output_file_normalized, tiff_options)
        saved = True
        actual_saved_path = output_file_normalized
        print(f"     ✓ Arquivo salvo com sucesso (método 1)!")
        print(f"     Caminho: {output_file_normalized}")
    except Exception as e1:
        last_error = str(e1)
        print(f"     Método 1 falhou: {last_error}")
        try:
            # Método 2: Salvar diretamente com caminho normalizado
            print("     Tentando método 2: Salvar diretamente...")
            doc.SaveAs(output_file_normalized)
            saved = True
            actual_saved_path = output_file_normalized
            print(f"     ✓ Arquivo salvo com sucesso (método 2)!")
            print(f"     Caminho: {output_file_normalized}")
        except Exception as e2:
            last_error = str(e2)
            print(f"     Método 2 falhou: {last_error}")
            try:
                # Método 3: Verificar onde o documento atual está salvo e usar esse caminho
                print("     Tentando método 3: Verificar caminho do documento...")
                if hasattr(doc, 'FullName') and doc.FullName:
                    current_path = doc.FullName
                    print(f"     Caminho atual do documento: {current_path}")
                    # Salvar no mesmo diretório com nome diferente
                    base_dir = os.path.dirname(current_path)
                    new_name = os.path.basename(output_file_normalized)
                    alt_path = os.path.join(base_dir, new_name).replace('/', '\\')
                    print(f"     Tentando salvar em: {alt_path}")
                    tiff_options = win32com.client.Dispatch("Photoshop.TiffSaveOptions")
                    tiff_options.Transparency = True
                    doc.SaveAs(alt_path, tiff_options)
                    saved = True
                    actual_saved_path = alt_path
                    print(f"     ✓ Arquivo salvo com sucesso (método 3)!")
                    print(f"     Caminho: {alt_path}")
                else:
                    raise Exception("Não foi possível obter caminho do documento")
            except Exception as e3:
                last_error = str(e3)
                print(f"     Método 3 falhou: {last_error}")
                doc.Close(2)
                print(f"\n❌ ERRO: Não foi possível salvar o arquivo")
                print(f"   {last_error}")
                input("\nPressione ENTER para sair...")
                sys.exit(1)
    
    # Aguardar um pouco para o arquivo ser escrito
    time.sleep(2)
    
    # Verificar se o arquivo foi criado (tentar vários caminhos possíveis)
    checked_paths = [
        output_file_normalized,
        output_file,
        output_file_full,
    ]
    
    if actual_saved_path:
        checked_paths.insert(0, actual_saved_path)
    
    file_found = False
    for path_to_check in checked_paths:
        if os.path.exists(path_to_check):
            file_size = os.path.getsize(path_to_check)
            print(f"\n{'=' * 60}")
            print("✅ TESTE CONCLUÍDO COM SUCESSO!")
            print(f"{'=' * 60}")
            print(f"\n✓ Arquivo salvo em: {path_to_check}")
            print(f"✓ Tamanho: {file_size:,} bytes ({file_size / 1024:.2f} KB)")
            print(f"\nVocê pode verificar o arquivo TIFF gerado!")
            file_found = True
            break
    
    if not file_found:
        print(f"\n⚠ AVISO: Arquivo não encontrado nos caminhos esperados:")
        for path in checked_paths:
            print(f"   - {path}")
        print(f"\nO arquivo pode ter sido salvo em outro local.")
        print(f"Verifique o diretório do documento atual no Photoshop.")
    
    # Fechar documento
    print(f"\n     Fechando documento...")
    doc.Close(2)  # 2 = DoNotSaveChanges
    time.sleep(1)
    
    print(f"\n{'=' * 60}")
    input("\nPressione ENTER para sair...")
    
except Exception as e:
    print(f"\n{'=' * 60}")
    print(f"❌ ERRO GERAL: {str(e)}")
    print(f"{'=' * 60}")
    import traceback
    traceback.print_exc()
    input("\nPressione ENTER para sair...")
    sys.exit(1)

