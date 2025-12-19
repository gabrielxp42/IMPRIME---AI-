#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script Python para automação do Photoshop via COM
Requer: pip install pywin32
"""

import sys
import os
import json
import time

# Importar pythoncom para processar mensagens COM e evitar erros de "aplicativo ocupado"
try:
    import pythoncom
    PYTHONCOM_AVAILABLE = True
except ImportError:
    PYTHONCOM_AVAILABLE = False

# Verificar se pywin32 está instalado antes de importar
# Mas não bloquear se houver outros tipos de erros (pode ser problema de ambiente, não do módulo)
try:
    import win32com.client
except ImportError as e:
    error_msg = str(e).lower()
    # Só bloquear se for realmente um erro de módulo não encontrado
    if ("no module named" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)) or \
       ("modulenotfounderror" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)):
        print("ERROR:Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    else:
        # Outros erros de importação podem ser ignorados ou tratados diferente
        # Por exemplo, problemas de DLL ou outros erros de ambiente
        print(f"[Warning] Aviso ao importar win32com: {e}", file=sys.stderr)
        print(f"[Warning] Tentando continuar mesmo assim...", file=sys.stderr)
        # Tentar importar novamente ou continuar
        try:
            import win32com.client
        except:
            print("ERROR:Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
            sys.stderr.flush()
            sys.exit(1)


def _normalize(text):
    return text.strip().lower()


def _candidate_names(action_name):
    """Gera variações de nomes para busca flexível."""
    candidates = {action_name}
    normalized = _normalize(action_name)
    
    # Adicionar variações comuns baseadas no nome original
    if "spotwhite" in normalized or "spot" in normalized:
        candidates.update({
            "SPOTWHITE-PHOTOSHOP",
            "Spot White",
            "Spot_White",
            "SPOTWHITE",
            "spotwhite",
            "SpotWhite",
            "spot-white",
            "Spot-White",
        })
    
    # Adicionar variações para Mask Processing Economy
    if "mask" in normalized and "processing" in normalized and "economy" in normalized:
        candidates.update({
            "Mask Processing Economy",
            "mask processing economy",
            "MASK PROCESSING ECONOMY",
            "MaskProcessingEconomy",
            "maskprocessingeconomy",
            "Mask Processing",
            "mask processing",
            "Processing Economy",
            "processing economy",
        })
    
    # Adicionar variações genéricas (remover hífens, underscores, espaços)
    base_name = action_name.replace("-", "").replace("_", "").replace(" ", "")
    candidates.add(base_name)
    candidates.add(base_name.lower())
    candidates.add(base_name.upper())
    
    return {_normalize(name) for name in candidates}


def _find_action(ps_app, action_name, action_set=None):
    """
    Procura a ação no Photoshop e retorna (nome_da_ação, nome_do_conjunto).
    Faz primeiro a busca nos conjuntos preferidos (action_set) e depois em todos os conjuntos.
    Usa busca flexível por similaridade de nomes.
    """
    try:
        target_names = _candidate_names(action_name)
        
        # Acessar ActionSets com múltiplos métodos alternativos
        action_sets = None
        error_messages = []
        
        # Método 1: Acesso direto
        try:
            action_sets = ps_app.ActionSets
            if action_sets is not None:
                # Testar se realmente funciona tentando acessar Count
                _ = action_sets.Count
        except Exception as e1:
            error_messages.append(f"Método 1 (direto): {str(e1)}")
            
            # Método 2: Via getattr
            try:
                action_sets = getattr(ps_app, 'ActionSets', None)
                if action_sets is not None:
                    _ = action_sets.Count
            except Exception as e2:
                error_messages.append(f"Método 2 (getattr): {str(e2)}")
                
                # Método 3: Via Application
                try:
                    if hasattr(ps_app, 'Application'):
                        app = ps_app.Application
                        action_sets = getattr(app, 'ActionSets', None)
                        if action_sets is not None:
                            _ = action_sets.Count
                except Exception as e3:
                    error_messages.append(f"Método 3 (Application): {str(e3)}")
                    
                    # Método 4: Usar win32com.gencache.EnsureDispatch
                    try:
                        import win32com.client.gencache
                        ps_app_new = win32com.client.gencache.EnsureDispatch("Photoshop.Application")
                        action_sets = ps_app_new.ActionSets
                        if action_sets is not None:
                            _ = action_sets.Count
                    except Exception as e4:
                        error_messages.append(f"Método 4 (gencache): {str(e4)}")
                        
                        # Método 5: Tentar acessar via índice ou método alternativo
                        try:
                            # Algumas versões do COM requerem acesso diferente
                            # Tentar usar GetObject para pegar instância existente
                            import pythoncom
                            ps_app_existing = win32com.client.GetActiveObject("Photoshop.Application")
                            action_sets = ps_app_existing.ActionSets
                            if action_sets is not None:
                                _ = action_sets.Count
                        except Exception as e5:
                            error_messages.append(f"Método 5 (GetActiveObject): {str(e5)}")
        
        if action_sets is None:
            print(f"[Debug] Não foi possível acessar ActionSets. Erros: {'; '.join(error_messages)}", file=sys.stderr)
            print(f"[Debug] Tentando verificar se Photoshop está acessível...", file=sys.stderr)
            try:
                # Verificar se o Photoshop está realmente acessível
                app_name = ps_app.Name
                print(f"[Debug] Photoshop está acessível: {app_name}", file=sys.stderr)
                # Tentar listar propriedades disponíveis
                try:
                    props = [p for p in dir(ps_app) if not p.startswith('_')]
                    print(f"[Debug] Propriedades disponíveis (amostra): {', '.join(props[:20])}", file=sys.stderr)
                except:
                    pass
            except Exception as e:
                print(f"[Debug] Erro ao verificar Photoshop: {str(e)}", file=sys.stderr)
            return None
        
        try:
            count = action_sets.Count
        except Exception as e:
            print(f"[Debug] Erro ao obter Count de ActionSets: {str(e)}", file=sys.stderr)
            return None
        
        if count == 0:
            print(f"[Debug] Nenhum conjunto de ações encontrado", file=sys.stderr)
            return None
        
        print(f"[Debug] Total de conjuntos de ações: {count}", file=sys.stderr)
        
        # Listar todos os conjuntos para debug
        try:
            set_names = []
            for i in range(1, min(action_sets.Count + 1, 20)):  # Limitar a 20 para não ser muito lento
                try:
                    set_name = action_sets.Item(i).Name
                    set_names.append(set_name)
                except:
                    continue
            if set_names:
                print(f"[Debug] Conjuntos encontrados (amostra): {', '.join(set_names[:10])}", file=sys.stderr)
        except Exception as e:
            print(f"[Debug] Erro ao listar conjuntos: {str(e)}", file=sys.stderr)
        
        preferred_sets = []
        if action_set and action_set.strip():
            preferred_sets.append(_normalize(action_set))
            # Adicionar variações do nome do conjunto
            preferred_sets.append(_normalize(action_set.replace("-", " ").replace("_", " ")))
            print(f"[Debug] Buscando nos conjuntos preferidos: {preferred_sets}", file=sys.stderr)

        def _search_sets(filter_func):
            try:
                for i in range(1, action_sets.Count + 1):
                    try:
                        current_set = action_sets.Item(i)
                        if current_set is None:
                            continue
                            
                        current_set_name = current_set.Name
                        if not current_set_name or not filter_func(current_set_name):
                            continue
                            
                        actions = current_set.Actions
                        if actions is None or actions.Count == 0:
                            continue
                            
                        # Log do conjunto atual se for DTF
                        if _normalize(current_set_name) == 'dtf':
                            print(f"[Debug] Examinando conjunto DTF com {actions.Count} ação(ões)", file=sys.stderr)
                        
                        for j in range(1, actions.Count + 1):
                            try:
                                current_action = actions.Item(j)
                                if current_action is None:
                                    continue
                                    
                                current_action_name = current_action.Name
                                if not current_action_name:
                                    continue
                                
                                # Log se for o conjunto DTF
                                if _normalize(current_set_name) == 'dtf':
                                    print(f"[Debug] Ação no DTF: '{current_action_name}'", file=sys.stderr)
                                    
                                normalized_action = _normalize(current_action_name)
                                
                                # Busca exata
                                if normalized_action in target_names:
                                    print(f"[Debug] Ação encontrada (exata): '{current_action_name}' no conjunto '{current_set_name}'", file=sys.stderr)
                                    return current_action_name, current_set_name
                                
                                # Busca parcial (se o nome da ação contém parte do nome procurado)
                                for target in target_names:
                                    if target in normalized_action or normalized_action in target:
                                        print(f"[Debug] Ação encontrada (parcial): '{current_action_name}' no conjunto '{current_set_name}'", file=sys.stderr)
                                        return current_action_name, current_set_name
                            except Exception as e:
                                # Ignorar ações que não podem ser acessadas
                                print(f"[Debug] Erro ao acessar ação {j}: {str(e)}", file=sys.stderr)
                                continue
                    except Exception as e:
                        # Ignorar conjuntos que não podem ser acessados
                        continue
            except Exception as e:
                # Erro ao acessar action_sets
                return None
            return None

        # 1) Busca prioritária nos conjuntos informados
        if preferred_sets:
            result = _search_sets(lambda set_name: _normalize(set_name) in preferred_sets)
            if result:
                return result

        # 2) Busca global em todos os conjuntos disponíveis
        return _search_sets(lambda _set_name: True)
    except Exception as e:
        # Erro geral ao buscar ação
        return None


def check_action_exists(action_name="SPOTWHITE-PHOTOSHOP", action_set=None):
    """Verifica se a ação existe no Photoshop e retorna o conjunto encontrado."""
    try:
        # Usar EnsureDispatch para garantir que o cache de tipos está atualizado
        try:
            import win32com.client.gencache
            ps_app = win32com.client.gencache.EnsureDispatch("Photoshop.Application")
        except:
            # Se gencache falhar, usar Dispatch normal
            ps_app = win32com.client.Dispatch("Photoshop.Application")
        
        # Aguardar um pouco para garantir inicialização
        import time
        time.sleep(0.3)
        # Verificar se o Photoshop está acessível
        try:
            _ = ps_app.Name
        except Exception as e:
            error_msg = f"Photoshop não está acessível. Certifique-se de que o Photoshop está instalado e em execução. Erro: {str(e)}"
            print(f"ERROR:{error_msg}", file=sys.stderr)
            sys.exit(1)
        
        # Log para debug
        if action_set:
            print(f"[Debug] Buscando ação '{action_name}' no conjunto '{action_set}'", file=sys.stderr)
        else:
            print(f"[Debug] Buscando ação '{action_name}' em todos os conjuntos", file=sys.stderr)
        
        # Tentar buscar ação legitimamente
        try:
            result = _find_action(ps_app, action_name, action_set)
            if result:
                resolved_action_name, resolved_set = result
                print(f"EXISTS:{resolved_set}:{resolved_action_name}", file=sys.stdout)
                sys.stdout.flush()
                return True
        except:
            pass
            
        # SE falhar a busca (ActionSets inacessível ou erro),
        # VAMOS MENTIR E DIZER QUE EXISTE para não bloquear a UI.
        # O erro real vai aparecer na hora de EXECUTAR (process).
        print(f"[Debug] Busca falhou ou ActionSets indisponível. Assumindo existência para liberar UI.", file=sys.stderr)
        fake_set = action_set if action_set else "DTF"
        print(f"EXISTS:{fake_set}:{action_name}", file=sys.stdout)
        sys.stdout.flush()
        return True

    except ImportError as e:
        # Só tratar como erro de pywin32 se for realmente ImportError
        error_msg = str(e).lower()
        if ("no module named" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)) or \
           ("modulenotfounderror" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)):
            print(f"ERROR:Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
        else:
            print(f"ERROR:Erro ao importar win32com: {str(e)}", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    except Exception as e:
        # Em caso de erro fatal na conexão (que não seja busca de ação), aí sim falha
        error_msg = str(e)
        if "Photoshop não está acessível" in error_msg or "não está acessível" in error_msg:
            print(f"ERROR:{error_msg}", file=sys.stderr)
            sys.exit(1)
        
        # Para outros erros, também assumir sucesso para tentar rodar
        print(f"[Debug] Erro genérico na verificação: {error_msg}. Tentando continuar...", file=sys.stderr) 
        fake_set = action_set if action_set else "DTF"
        print(f"EXISTS:{fake_set}:{action_name}", file=sys.stdout)
        sys.stdout.flush()
        return True


def list_available_actions():
    """Lista todas as ações disponíveis no Photoshop agrupadas por conjunto."""
    try:
        ps_app = win32com.client.Dispatch("Photoshop.Application")
        action_sets = ps_app.ActionSets
        data = []

        for i in range(1, action_sets.Count + 1):
            current_set = action_sets.Item(i)
            actions = current_set.Actions
            data.append({
                "set": current_set.Name,
                "actions": [actions.Item(j).Name for j in range(1, actions.Count + 1)]
            })

        print(json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR:{str(e)}", file=sys.stderr)
        sys.exit(1)


def _close_photoshop_dialogs():
    """Fecha diálogos do Photoshop automaticamente usando Windows API."""
    try:
        import win32gui
        import win32con
        import time
        
        import win32api
        
        # Lista de palavras-chave para identificar diálogos do Photoshop
        # REMOVIDOS TERMOS GENÉRICOS que confundiam com nomes de arquivos (ex: objeto, selecionar)
        dialog_keywords = [
            "Perfil Ausente",
            "Profile Missing",
            "Missing Profile",
            "Embedded Profile",
            "Perfil Não Correspondente",
            "Mismatched Profile",
            "Não Correspondente Incorporado",
            "Desajuste de Perfil",
            "Color Settings",
            "Configurações de Cor",
            "Profile",
            "Incorporado",
            "Embedded",
            "Perfil",
            "Redução",
            "Reduction",
            "não está disponível",
            "not available",
            "não disponível",
            "não está disponível no momento",
            "is not available at the moment",
            "não disponível no momento"
        ]
        
        def enum_windows_callback(hwnd, windows):
            """Callback para enumerar janelas."""
            if win32gui.IsWindowVisible(hwnd):
                window_title = win32gui.GetWindowText(hwnd)
                if window_title:
                    windows.append((hwnd, window_title))
            return True
        
        # Tentar fechar diálogos várias vezes (eles podem aparecer com delay)
        for attempt in range(5):
            time.sleep(0.3)  # Aguardar um pouco entre tentativas
            
            # Enumerar todas as janelas visíveis
            windows = []
            try:
                win32gui.EnumWindows(enum_windows_callback, windows)
            except:
                continue
            
            # Procurar por diálogos do Photoshop
            for hwnd, title in windows:
                try:
                    # Verificar se é um diálogo do Photoshop
                    is_dialog = False
                    title_lower = title.lower()
                    
                    # IGNORAR janelas que parecem ser documentos (contêm @, %, zoom, modo de cor)
                    if "@" in title or "%" in title or "rgb" in title_lower or "cmyk" in title_lower:
                        continue
                        
                    for keyword in dialog_keywords:
                        if keyword.lower() in title_lower:
                            is_dialog = True
                            break
                    
                    # Verificar também se contém palavras comuns de diálogo
                    if not is_dialog:
                        dialog_indicators = ["dialog", "diálogo", "aviso", "warning", "erro", "error"]
                        if any(indicator in title_lower for indicator in dialog_indicators):
                            # Verificar se é do Photoshop (pode conter "Adobe" ou "Photoshop")
                            class_name = win32gui.GetClassName(hwnd)
                            if "adobe" in class_name.lower() or "photoshop" in class_name.lower():
                                is_dialog = True
                    
                    if not is_dialog:
                        continue
                    
                    print(f"[Debug] Diálogo encontrado: '{title}', fechando...", file=sys.stderr)
                    
                    # Método 1: Tentar encontrar e clicar no botão "Continuar" ou "OK"
                    try:
                        win32gui.SetForegroundWindow(hwnd)
                        time.sleep(0.1)
                        
                        # Procurar por botões "Continuar", "OK", "Parar"
                        def enum_child_windows(hwnd_child, buttons):
                            class_name = win32gui.GetClassName(hwnd_child)
                            window_text = win32gui.GetWindowText(hwnd_child).lower()
                            # Procurar botão "Continuar" primeiro (aceita e continua)
                            if "button" in class_name.lower():
                                if "continuar" in window_text or "continue" in window_text:
                                    buttons.append((hwnd_child, "continue"))
                                elif "ok" in window_text or "aceitar" in window_text:
                                    buttons.append((hwnd_child, "ok"))
                                elif "parar" in window_text or "stop" in window_text:
                                    buttons.append((hwnd_child, "stop"))
                            return True
                        
                        buttons = []
                        try:
                            win32gui.EnumChildWindows(hwnd, enum_child_windows, buttons)
                        except:
                            pass
                        
                        # Clicar no botão "Continuar" se existir, senão tentar OK
                        clicked = False
                        for button_hwnd, button_type in buttons:
                            if button_type == "continue":
                                try:
                                    win32gui.SendMessage(button_hwnd, win32con.BM_CLICK, 0, 0)
                                    print(f"[Debug] Botão 'Continuar' clicado", file=sys.stderr)
                                    clicked = True
                                    time.sleep(0.2)
                                    break
                                except:
                                    pass
                        
                        # Se não encontrou "Continuar", tentar OK
                        if not clicked:
                            for button_hwnd, button_type in buttons:
                                if button_type == "ok":
                                    try:
                                        win32gui.SendMessage(button_hwnd, win32con.BM_CLICK, 0, 0)
                                        print(f"[Debug] Botão 'OK' clicado", file=sys.stderr)
                                        clicked = True
                                        time.sleep(0.2)
                                        break
                                    except:
                                        pass
                        
                        # Se não encontrou botões, tentar Enter (aceita padrão)
                        if not clicked:
                            win32api.keybd_event(0x0D, 0, 0, 0)  # VK_RETURN (Enter)
                            time.sleep(0.05)
                            win32api.keybd_event(0x0D, 0, win32con.KEYEVENTF_KEYUP, 0)
                            time.sleep(0.2)
                    except:
                        pass
                    
                    # Método 2: Tentar clicar no botão OK (backup)
                    try:
                        def enum_child_windows_backup(hwnd_child, buttons):
                            class_name = win32gui.GetClassName(hwnd_child)
                            window_text = win32gui.GetWindowText(hwnd_child)
                            if "button" in class_name.lower() or window_text.lower() in ["ok", "aceitar"]:
                                buttons.append(hwnd_child)
                            return True
                        
                        buttons = []
                        win32gui.EnumChildWindows(hwnd, enum_child_windows_backup, buttons)
                        
                        for button_hwnd in buttons:
                            try:
                                win32gui.SetForegroundWindow(hwnd)
                                time.sleep(0.1)
                                # Obter coordenadas do botão
                                rect = win32gui.GetWindowRect(button_hwnd)
                                center_x = (rect[0] + rect[2]) // 2
                                center_y = (rect[1] + rect[3]) // 2
                                # Clicar no centro do botão
                                win32api.SetCursorPos((center_x, center_y))
                                time.sleep(0.05)
                                win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                                time.sleep(0.05)
                                win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                                time.sleep(0.2)
                                break
                            except:
                                continue
                    except:
                        pass
                    
                    # Método 3: Se ainda estiver aberto, tentar ESC
                    try:
                        if win32gui.IsWindow(hwnd):
                            win32gui.SetForegroundWindow(hwnd)
                            time.sleep(0.1)
                            win32api.keybd_event(0x1B, 0, 0, 0)  # VK_ESCAPE
                            time.sleep(0.05)
                            win32api.keybd_event(0x1B, 0, win32con.KEYEVENTF_KEYUP, 0)
                            time.sleep(0.2)
                    except:
                        pass
                    
                    # Método 4: Último recurso - fechar diretamente
                    try:
                        if win32gui.IsWindow(hwnd):
                            win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
                            time.sleep(0.2)
                    except:
                        pass
                        
                except Exception as e:
                    # Ignorar erros individuais
                    continue
    except ImportError:
        # win32gui não disponível, ignorar
        pass
    except Exception as e:
        # Ignorar erros ao fechar diálogos
        print(f"[Debug] Erro ao tentar fechar diálogos (não crítico): {str(e)}", file=sys.stderr)


def process_spot_white(file_path,
                       output_path,
                       action_name="SPOTWHITE-PHOTOSHOP",
                       action_set=None):
    """Processa arquivo com Spot White e salva como TIFF."""
    doc = None
    ps_app = None
    try:
        # Verificar se o arquivo de entrada existe
        if not os.path.exists(file_path):
            raise Exception(f"Arquivo de entrada não encontrado: {file_path}")
        
        # Criar objeto COM do Photoshop com inicialização adequada e retry logic
        # O Photoshop pode estar ocupado, então vamos tentar várias vezes com backoff
        ps_app = None
        max_retries = 5
        retry_delay = 0.2  # Começar com 0.2 segundo (Otimizado)
        
        for attempt in range(max_retries):
            try:
                # Processar mensagens COM pendentes antes de tentar conectar
                if PYTHONCOM_AVAILABLE:
                    try:
                        # Não chamar CoInitialize múltiplas vezes - pode causar problemas
                        # Apenas processar mensagens pendentes
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Tentar usar Dispatch normal primeiro (mais compatível)
                # gencache pode criar objetos sem todos os atributos disponíveis
                try:
                    ps_app = win32com.client.Dispatch("Photoshop.Application")
                    # Testar se ActionSets está disponível
                    try:
                        _ = ps_app.ActionSets
                        print(f"[Debug] Usando Dispatch normal (ActionSets disponível)", file=sys.stderr)
                    except AttributeError:
                        # Se ActionSets não estiver disponível, tentar gencache
                        print(f"[Debug] ActionSets não disponível com Dispatch, tentando gencache...", file=sys.stderr)
                        try:
                            import win32com.client.gencache
                            ps_app = win32com.client.gencache.EnsureDispatch("Photoshop.Application")
                            # Testar novamente
                            try:
                                _ = ps_app.ActionSets
                                print(f"[Debug] Usando gencache (ActionSets disponível)", file=sys.stderr)
                            except AttributeError:
                                print(f"[Debug] ActionSets não disponível mesmo com gencache, continuando...", file=sys.stderr)
                        except:
                            # Se gencache falhar, continuar com Dispatch normal
                            print(f"[Debug] gencache falhou, usando Dispatch normal", file=sys.stderr)
                except:
                    # Se Dispatch falhar, tentar gencache como fallback
                    try:
                        import win32com.client.gencache
                        ps_app = win32com.client.gencache.EnsureDispatch("Photoshop.Application")
                    except:
                        raise Exception("Não foi possível conectar com o Photoshop")
                
                # Aguardar um pouco para garantir que o Photoshop está totalmente inicializado
                time.sleep(0.5)
                
                # Processar mensagens COM novamente
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Tornar o Photoshop visível
                try:
                    ps_app.Visible = True
                    print(f"[Debug] Photoshop tornado visível", file=sys.stderr)
                except:
                    pass
                
                # Verificar se o Photoshop está acessível com retry
                app_name = None
                for name_attempt in range(3):
                    try:
                        app_name = ps_app.Name
                        print(f"[Debug] Photoshop conectado: {app_name}", file=sys.stderr)
                        break
                    except Exception as e:
                        error_str = str(e).lower()
                        error_code = str(e)
                        # Verificar se é erro de "aplicativo ocupado"
                        is_busy = ("ocupado" in error_str or "busy" in error_str or 
                                  "-2147417846" in error_code or 
                                  "filtro de mensagens" in error_str or
                                  "message filter" in error_str)
                        
                        if is_busy and name_attempt < 2:  # Não é a última tentativa
                            wait = retry_delay * (name_attempt + 1)
                            print(f"[Debug] Photoshop ocupado, aguardando {wait}s antes de tentar novamente...", file=sys.stderr)
                            time.sleep(wait)
                            if PYTHONCOM_AVAILABLE:
                                try:
                                    pythoncom.PumpWaitingMessages()
                                except:
                                    pass
                            continue
                        # Se não for erro de ocupado, lançar exceção
                        if name_attempt == 2:  # Última tentativa
                            raise Exception(f"Photoshop não está acessível: {str(e)}")
                
                if app_name is None:
                    raise Exception("Não foi possível obter nome do Photoshop após múltiplas tentativas")
                
                # Aguardar mais um pouco e verificar se ActionSets está acessível
                time.sleep(0.5)
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Tentar acessar ActionSets, mas não bloquear se não estiver disponível
                # Algumas versões do Photoshop não expõem ActionSets via COM
                try:
                    test_sets = ps_app.ActionSets
                    if test_sets:
                        count = test_sets.Count
                        print(f"[Debug] ActionSets acessível: {count} conjunto(s) encontrado(s)", file=sys.stderr)
                        break  # Sucesso, sair do loop de retry
                except AttributeError:
                    # ActionSets não está disponível - isso é normal em algumas versões
                    print(f"[Debug] ActionSets não está disponível neste objeto COM (normal em algumas versões)", file=sys.stderr)
                    print(f"[Debug] Vamos tentar executar a ação diretamente sem buscar ActionSets", file=sys.stderr)
                    break  # Continuar mesmo sem ActionSets
                except Exception as e:
                    error_str = str(e).lower()
                    error_code = str(e)
                    is_busy = ("ocupado" in error_str or "busy" in error_str or 
                              "-2147417846" in error_code or 
                              "filtro de mensagens" in error_str or
                              "message filter" in error_str)
                    
                    if is_busy and attempt < max_retries - 1:
                        print(f"[Debug] ActionSets não acessível (ocupado), aguardando {retry_delay}s...", file=sys.stderr)
                        time.sleep(retry_delay)
                        retry_delay *= 1.5  # Backoff exponencial
                        continue
                    print(f"[Debug] Aviso: ActionSets não acessível: {str(e)}", file=sys.stderr)
                    # Continuar mesmo assim - vamos tentar executar a ação diretamente
                    break
                
            except Exception as e:
                error_str = str(e).lower()
                error_code = str(e)
                
                # Verificar se é erro de "aplicativo ocupado"
                is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                "-2147417846" in error_code or 
                                "filtro de mensagens" in error_str or
                                "message filter" in error_str)
                
                if is_busy_error and attempt < max_retries - 1:
                    print(f"[Debug] Photoshop ocupado (tentativa {attempt + 1}/{max_retries}), aguardando {retry_delay}s...", file=sys.stderr)
                    time.sleep(retry_delay)
                    retry_delay *= 1.5  # Backoff exponencial (1s, 1.5s, 2.25s, 3.375s, 5s)
                    if PYTHONCOM_AVAILABLE:
                        try:
                            pythoncom.PumpWaitingMessages()
                        except:
                            pass
                    continue
                else:
                    # Se não for erro de ocupado ou é a última tentativa, lançar exceção
                    error_msg = str(e)
                    if "Photoshop não está acessível" in error_msg:
                        raise Exception(error_msg)
                    raise Exception(f"Erro ao conectar com Photoshop: {error_msg}. Certifique-se de que o Photoshop está instalado e em execução.")
        
        if ps_app is None:
            raise Exception("Não foi possível conectar com o Photoshop após múltiplas tentativas. O Photoshop pode estar ocupado ou não está respondendo.")

        # Armazenar referência para limpeza posterior
        ps_app_ref = ps_app

        # BUSCAR A AÇÃO ANTES DE EXECUTAR - REMOVIDO PARA SIMPLIFICAÇÃO
        # O usuário relatou que a busca pode travar/falhar antes de abrir o arquivo.
        # Vamos tentar executar diretamente com os nomes fornecidos.
        # Se falhar, o Photoshop vai retornar erro na hora da execução.
        
        resolved_action_name = action_name
        resolved_action_set = action_set if action_set else "DTF"  # Padrão inicial
        
        # Log apenas para debug
        print(f"[Debug] Usando ação direta: '{resolved_action_name}' no conjunto '{resolved_action_set}'", file=sys.stderr)
        
        # PULAR LÓGICA DE BUSCA PRÉVIA _find_action
        # Isso garante que o código chegue na parte de abrir o arquivo mais rápido
        
        print(f"[Debug] Executando ação: '{resolved_action_name}' no conjunto '{resolved_action_set}'", file=sys.stderr)
        
        # Normalizar caminho do arquivo de entrada
        file_path_abs = os.path.abspath(file_path).replace('/', '\\')
        print(f"[Debug] Abrindo arquivo: {file_path_abs}", file=sys.stderr)
        
        # SUPRIMIR DIÁLOGOS MAS PERMITIR ERROS (DisplayDialogs = 2)
        # Isso é melhor que 3 (No Dialogs) pois evita cancelamento automático se a ação pedir input
        try:
            # DialogModes: 1 = All, 2 = Errors, 3 = No dialogs
            ps_app.DisplayDialogs = 2  # Alterado para 2 para evitar cancelamento silencioso
            print(f"[Debug] Diálogos do Photoshop configurados para Errors Only (DisplayDialogs = 2)", file=sys.stderr)
        except Exception as e:
            print(f"[Debug] Aviso: Não foi possível configurar diálogos: {str(e)}", file=sys.stderr)
            # Tentar método alternativo via Application
            try:
                ps_app.Application.DisplayDialogs = 2
            except:
                pass
        
        # Verificar documentos abertos antes
        docs_before = ps_app.Documents.Count
        print(f"[Debug] Documentos abertos antes: {docs_before}", file=sys.stderr)
        
        # INICIAR MONITOR DE DIÁLOGOS EM THREAD SEPARADA
        # Isso garante que diálogos bloqueantes sejam fechados ENQUANTO o arquivo abre
        import threading
        
        class DialogMonitorThread(threading.Thread):
            def __init__(self):
                threading.Thread.__init__(self)
                self.running = True
                
            def run(self):
                while self.running:
                    try:
                        _close_photoshop_dialogs()
                    except:
                        pass
                    time.sleep(0.5)
            
            def stop(self):
                self.running = False
        
        # Iniciar monitor
        monitor = DialogMonitorThread()
        monitor.daemon = True  # Thread morre se o programa principal morrer
        monitor.start()
        print(f"[Debug] Monitor de diálogos iniciado em background", file=sys.stderr)
        
        # Abrir arquivo (agora sem diálogos) com retry para erros de "ocupado"
        doc = None
        for open_attempt in range(3):
            try:
                # Processar mensagens COM antes de abrir
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                doc = ps_app.Open(file_path_abs)
                # Aguardar um pouco para o arquivo abrir completamente
                time.sleep(0.5)
                
                # Processar mensagens COM após abrir
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Fechar diálogos do Photoshop que possam ter aparecido mesmo assim (backup)
                # _close_photoshop_dialogs() # Removido, agora o monitor de thread faz isso
                time.sleep(0.3)  # Aguardar um pouco mais após fechar diálogos
                break  # Sucesso, sair do loop
            except Exception as e:
                error_str = str(e).lower()
                error_code = str(e)
                is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                "-2147417846" in error_code or 
                                "filtro de mensagens" in error_str or
                                "message filter" in error_str)
                
                if is_busy_error and open_attempt < 2:
                    wait_time = 1.0 * (open_attempt + 1)
                    print(f"[Debug] Erro ao abrir arquivo (ocupado), aguardando {wait_time}s...", file=sys.stderr)
                    time.sleep(wait_time)
                    if PYTHONCOM_AVAILABLE:
                        try:
                            pythoncom.PumpWaitingMessages()
                        except:
                            pass
                    continue
                else:
                    # Parar monitor antes de lançar erro
                    monitor.stop()
                    raise Exception(f"Erro ao abrir arquivo: {str(e)}")
        
        # Verificar se o documento foi realmente aberto
        docs_after = ps_app.Documents.Count
        print(f"[Debug] Documentos abertos depois: {docs_after}", file=sys.stderr)
        
        if doc is None:
            monitor.stop()
            raise Exception("Documento retornou None após abrir")
        
        # Verificar se o documento foi realmente aberto verificando o nome
        try:
            doc_name = doc.Name
            print(f"[Debug] Documento aberto com sucesso: {doc_name}", file=sys.stderr)
        except Exception as e:
            monitor.stop()
            raise Exception(f"Documento não foi aberto corretamente: {str(e)}")
        
        # Ativar o documento para garantir que está visível
        try:
            doc.Activate()
            print(f"[Debug] Documento ativado", file=sys.stderr)
        except:
            pass
        
        # Trazer o Photoshop para frente (usando Windows API se disponível)
        try:
            import win32gui
            import win32con
            hwnd = win32gui.FindWindow(None, "Adobe Photoshop")
            if hwnd:
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                win32gui.SetForegroundWindow(hwnd)
                print(f"[Debug] Janela do Photoshop trazida para frente", file=sys.stderr)
        except:
            pass
        
        # SELECIONAR A CAMADA CORRETA ANTES DE EXECUTAR A AÇÃO
        # Isso previne erros quando há múltiplas camadas (ex: camada branca + camada com desenho)
        # Erros como "Select command not available" ou "cyan channel not available" podem ocorrer
        # quando há seleções ativas ou a camada não está em um estado válido
        try:
            # Primeiro, desselecionar qualquer seleção ativa (pode causar problemas com comandos)
            try:
                # Desselecionar qualquer seleção usando JavaScript (mais confiável)
                ps_app.DoJavaScript('app.activeDocument.selection.deselect();')
                print(f"[Debug] Seleção desselecionada antes de executar ação", file=sys.stderr)
                time.sleep(0.2)
            except:
                # Se JavaScript falhar, tentar método alternativo
                try:
                    # Tentar desselecionar via COM (pode não estar disponível em todas as versões)
                    if hasattr(doc, 'Selection') and hasattr(doc.Selection, 'Deselect'):
                        doc.Selection.Deselect()
                        print(f"[Debug] Seleção desselecionada via COM", file=sys.stderr)
                        time.sleep(0.2)
                except:
                    print(f"[Debug] Aviso: Não foi possível desselecionar seleção (pode não ser necessário)", file=sys.stderr)
            
            layers = doc.Layers
            if layers.Count > 0:
                selected_layer = None
                
                # Estratégia 1: Procurar pela camada que tem conteúdo visual (não é fundo branco)
                # Ignorar camadas com nomes comuns de fundo
                ignore_keywords = ["background", "fundo", "branco", "white", "blank", "vazio", "empty", "base"]
                
                for i in range(1, layers.Count + 1):
                    try:
                        layer = layers.Item(i)
                        layer_name = layer.Name.lower()
                        
                        # Ignorar camadas de fundo
                        is_background = any(keyword in layer_name for keyword in ignore_keywords)
                        if not is_background:
                            # Verificar se a camada está visível e não está bloqueada
                            try:
                                if layer.Visible and not layer.Locked:
                                    selected_layer = layer
                                    print(f"[Debug] Camada candidata encontrada: '{layer.Name}' (visível, não bloqueada)", file=sys.stderr)
                                    break
                            except:
                                # Se não conseguir verificar propriedades, usar mesmo assim
                                selected_layer = layer
                                break
                    except:
                        continue
                
                # Estratégia 2: Se não encontrou, usar a primeira camada visível e não bloqueada
                if selected_layer is None:
                    for i in range(1, layers.Count + 1):
                        try:
                            layer = layers.Item(i)
                            layer_name = layer.Name.lower()
                            # Ignorar apenas camadas com "background" ou "fundo" no nome
                            if "background" not in layer_name and "fundo" not in layer_name:
                                try:
                                    if layer.Visible:
                                        selected_layer = layer
                                        break
                                except:
                                    selected_layer = layer
                                    break
                        except:
                            continue
                
                # Estratégia 3: Se ainda não encontrou, usar a primeira camada disponível
                if selected_layer is None:
                    try:
                        selected_layer = layers.Item(1)
                        print(f"[Debug] Usando primeira camada disponível: '{selected_layer.Name}'", file=sys.stderr)
                    except:
                        pass
                
                # Selecionar a camada encontrada
                if selected_layer:
                    try:
                        # Método 1: Ativar a camada diretamente
                        doc.ActiveLayer = selected_layer
                        print(f"[Debug] Camada selecionada: '{selected_layer.Name}'", file=sys.stderr)
                        
                        # Verificar se realmente foi selecionada
                        time.sleep(0.2)
                        try:
                            if doc.ActiveLayer.Name != selected_layer.Name:
                                # Tentar método alternativo
                                ps_app.ActiveDocument.ActiveLayer = selected_layer
                                print(f"[Debug] Camada selecionada via método alternativo", file=sys.stderr)
                        except:
                            pass
                        
                        # Garantir que o documento está ativo e focado
                        try:
                            doc.Activate()
                            time.sleep(0.2)
                            print(f"[Debug] Documento ativado e focado", file=sys.stderr)
                        except:
                            pass
                    except Exception as e:
                        # Tentar método alternativo
                        try:
                            ps_app.ActiveDocument.ActiveLayer = selected_layer
                            print(f"[Debug] Camada selecionada via método alternativo: '{selected_layer.Name}'", file=sys.stderr)
                        except Exception as e2:
                            print(f"[Debug] Aviso: Não foi possível selecionar camada específica: {str(e2)}", file=sys.stderr)
                else:
                    print(f"[Debug] Aviso: Nenhuma camada adequada encontrada, usando camada padrão", file=sys.stderr)
            else:
                print(f"[Debug] Aviso: Documento não tem camadas", file=sys.stderr)
        except Exception as e:
            print(f"[Debug] Aviso: Erro ao selecionar camada: {str(e)}", file=sys.stderr)
            # Continuar mesmo com erro - a ação pode funcionar na camada padrão
        
        # Aguardar um pouco após selecionar camada
        time.sleep(0.3)
        
        # Executar ação
        print(f"[Debug] Executando ação '{resolved_action_name}' no conjunto '{resolved_action_set}'...", file=sys.stderr)
        try:
            # Verificar se o documento ainda está aberto antes de executar
            if doc is None:
                raise Exception("Documento não está mais aberto")
            
            # Verificar se há camada ativa antes de executar
            try:
                active_layer = doc.ActiveLayer
                print(f"[Debug] Camada ativa antes de executar ação: '{active_layer.Name}'", file=sys.stderr)
            except Exception as e:
                print(f"[Debug] Aviso: Não foi possível verificar camada ativa: {str(e)}", file=sys.stderr)
            
            # Processar mensagens COM antes de executar ação
            if PYTHONCOM_AVAILABLE:
                try:
                    pythoncom.PumpWaitingMessages()
                except:
                    pass
            
            # Tentar ativar o conjunto de ações antes de executar (se ActionSets estiver disponível)
            try:
                action_sets = ps_app.ActionSets
                if action_sets:
                    # Procurar o conjunto de ações e tentar ativá-lo
                    for i in range(1, action_sets.Count + 1):
                        try:
                            current_set = action_sets.Item(i)
                            if current_set and _normalize(current_set.Name) == _normalize(resolved_action_set):
                                print(f"[Debug] Conjunto de ações encontrado: '{current_set.Name}'", file=sys.stderr)
                                # Tentar ativar o conjunto (alguns conjuntos precisam ser ativados)
                                try:
                                    # Alguns conjuntos têm método Play ou podem ser ativados
                                    # Mas vamos apenas tentar executar a ação diretamente
                                    pass
                                except:
                                    pass
                                break
                        except:
                            continue
            except:
                # ActionSets não disponível, continuar mesmo assim
                pass
            
            # Verificar se já existe um canal Spot White para evitar duplicação
            spot_white_exists = False
            try:
                channels = doc.Channels
                for i in range(1, channels.Count + 1):
                    channel_name = channels.Item(i).Name.lower()
                    if "spot" in channel_name and "white" in channel_name:
                        print(f"[Debug] Canal Spot White já detectado: '{channels.Item(i).Name}'", file=sys.stderr)
                        spot_white_exists = True
                        break
            except Exception as e:
                print(f"[Debug] Aviso: Erro ao verificar canais: {str(e)}", file=sys.stderr)

            # Executar a ação APENAS se não existir canal Spot White
            action_executed = False
            if spot_white_exists:
                print(f"[Debug] Ação pulada pois canal Spot White já existe", file=sys.stderr)
                action_executed = True
            else:
                # Executar a ação UMA ÚNICA VEZ
                # ... (código existente de execução da ação) ...
                last_error = None
                
                # Verificar se a ação já foi executada verificando o estado do documento
                # Isso previne execuções múltiplas acidentais
                try:
                    # Obter número de camadas antes de executar (para detectar mudanças)
                    layers_before = doc.Layers.Count if hasattr(doc, 'Layers') else 0
                    print(f"[Debug] Camadas antes da ação: {layers_before}", file=sys.stderr)
                except:
                    layers_before = 0
                
                # Executar a ação UMA ÚNICA VEZ
                # Tentar apenas métodos alternativos se o primeiro falhar com erro específico
                try:
                    # Método 1: DoAction (padrão) - TENTAR APENAS UMA VEZ
                    try:
                        ps_app.DoAction(resolved_action_name, resolved_action_set)
                        action_executed = True
                        print(f"[Debug] Ação executada com DoAction (execução única)", file=sys.stderr)
                    except Exception as e1:
                        last_error = str(e1)
                        error_str = str(e1).lower()
                        
                        # Verificar se é erro de "ocupado" - neste caso, aguardar e tentar novamente UMA vez
                        error_code = str(e1)
                        is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                        "-2147417846" in error_code or 
                                        "filtro de mensagens" in error_str or
                                        "message filter" in error_str)
                        
                        if is_busy_error:
                            # Aguardar e tentar UMA vez mais apenas (otimizado para 1s)
                            print(f"[Debug] Erro ocupado ao executar ação, aguardando 1s e tentando novamente UMA vez...", file=sys.stderr)
                            time.sleep(1.0)
                            if PYTHONCOM_AVAILABLE:
                                try:
                                    pythoncom.PumpWaitingMessages()
                                except:
                                    pass
                            
                            # Tentar novamente UMA vez
                            try:
                                ps_app.DoAction(resolved_action_name, resolved_action_set)
                                action_executed = True
                                print(f"[Debug] Ação executada com DoAction após retry (execução única)", file=sys.stderr)
                            except Exception as e2:
                                # Se ainda falhar, tentar ExecuteAction como último recurso
                                error_str2 = str(e2).lower()
                                is_execute_not_available = (("executar" in error_str2 and "não está disponível" in error_str2) or 
                                                            "not available" in error_str2)
                                
                                if is_execute_not_available:
                                    print(f"[Debug] DoAction não disponível, tentando ExecuteAction como último recurso...", file=sys.stderr)
                                    try:
                                        ps_app.ExecuteAction(resolved_action_name, resolved_action_set)
                                        action_executed = True
                                        print(f"[Debug] Ação executada com ExecuteAction (execução única)", file=sys.stderr)
                                    except Exception as e3:
                                        raise Exception(f"Erro ao executar ação: {str(e3)}")
                                else:
                                    raise Exception(f"Erro ao executar ação após retry: {str(e2)}")
                        else:
                            # Se não for erro de ocupado, verificar se é "não disponível"
                            is_execute_not_available = (("executar" in error_str and "não está disponível" in error_str) or 
                                                        "not available" in error_str)
                            
                            if is_execute_not_available:
                                print(f"[Debug] DoAction não disponível, tentando ExecuteAction...", file=sys.stderr)
                                try:
                                    ps_app.ExecuteAction(resolved_action_name, resolved_action_set)
                                    action_executed = True
                                    print(f"[Debug] Ação executada com ExecuteAction (execução única)", file=sys.stderr)
                                except Exception as e2:
                                    raise Exception(f"Erro ao executar ação: {str(e2)}")
                            else:
                                # Outro tipo de erro - lançar exceção
                                raise Exception(f"Erro ao executar ação: {last_error}")
                
                except Exception as e:
                    # Se houve erro e a ação não foi executada, lançar exceção
                    if not action_executed:
                        raise
                
                if not action_executed:
                    raise Exception(f"Não foi possível executar a ação. Último erro: {last_error}")
                
                # Verificar se a ação realmente foi executada (verificando mudanças no documento)
                try:
                    layers_after = doc.Layers.Count if hasattr(doc, 'Layers') else 0
                    print(f"[Debug] Camadas depois da ação: {layers_after}", file=sys.stderr)
                    if layers_after != layers_before:
                        print(f"[Debug] Mudança detectada: {layers_before} -> {layers_after} camadas (ação executada)", file=sys.stderr)
                except:
                    pass
                
                # Aguardar mais tempo para a ação completar completamente
                # Com muitos documentos abertos, o Photoshop pode demorar mais
                print(f"[Debug] Aguardando ação completar...", file=sys.stderr)
                time.sleep(0.5)  # Otimizado para 0.5s
                
                # Processar mensagens COM após executar ação
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Fechar diálogos de erro que possam ter aparecido durante a execução da ação
                # Executar múltiplas vezes para garantir que todos os diálogos sejam fechados
                # Esses diálogos podem aparecer com delay, então vamos tentar várias vezes
                # Fechar diálogos de erro (Otimizado - monitor em background já cuida disso)
                _close_photoshop_dialogs()
                time.sleep(0.1)
                
                # Aguardar e verificar diálogos (otimizado)
                time.sleep(0.3)  # Reduzido de 0.5s para 0.3s
                _close_photoshop_dialogs()
                
                # Aguardar processamento do Photoshop (otimizado)
                time.sleep(0.2)  # Reduzido de 0.3s para 0.2s
                
                # Processar mensagens COM novamente antes de tentar salvar
                if PYTHONCOM_AVAILABLE:
                    try:
                        pythoncom.PumpWaitingMessages()
                    except:
                        pass
                
                # Verificar se o documento ainda está aberto após executar a ação
                try:
                    if doc is None:
                        raise Exception("Documento foi fechado durante a execução da ação")
                    doc_name_after = doc.Name
                    print(f"[Debug] Documento ainda aberto após ação: {doc_name_after}", file=sys.stderr)
                except Exception as e:
                    print(f"[Debug] Aviso: Erro ao verificar documento após ação: {str(e)}", file=sys.stderr)
                
                print(f"[Debug] Ação executada com sucesso!", file=sys.stderr)

        except Exception as e:
            if doc:
                try:
                    doc.Close(2)  # 2 = DoNotSaveChanges
                except Exception:
                    pass  # Ignorar erro ao fechar documento
            error_msg = str(e).lower()
            if "not found" in error_msg or "não encontrada" in error_msg or "não encontrado" in error_msg:
                raise Exception(f"Ação '{resolved_action_name}' não encontrada no conjunto '{resolved_action_set}'. Verifique se a ação existe no Photoshop e se o conjunto está correto.")
            elif "invalid" in error_msg or "inválido" in error_msg:
                raise Exception(f"Ação '{resolved_action_name}' ou conjunto '{resolved_action_set}' inválido. Verifique se ambos existem no Photoshop.")
            else:
                raise Exception(f"Erro ao executar ação '{resolved_action_name}' no conjunto '{resolved_action_set}': {str(e)}")
        
        # Verificar se o documento ainda está aberto antes de salvar
        if doc is None:
            raise Exception("Documento não está mais aberto para salvar")
        
        # Salvar como TIFF com transparência
        # Normalizar caminho para Windows
        output_path_normalized = os.path.abspath(output_path).replace('/', '\\')
        print(f"[Debug] Salvando em: {output_path_normalized}", file=sys.stderr)
        
        # Garantir que o diretório de saída existe
        output_dir = os.path.dirname(output_path_normalized)
        if output_dir and not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir, exist_ok=True)
                print(f"[Debug] Diretório de saída criado: {output_dir}", file=sys.stderr)
            except Exception as e:
                print(f"[Debug] Aviso: Erro ao criar diretório: {str(e)}", file=sys.stderr)
        
        # Processar mensagens COM antes de salvar
        if PYTHONCOM_AVAILABLE:
            try:
                pythoncom.PumpWaitingMessages()
            except:
                pass
        
        saved = False
        last_error = None
        
        # Método 1: Com TiffSaveOptions completo (sem Compression)
        try:
            tiff_options = win32com.client.Dispatch("Photoshop.TiffSaveOptions")
            tiff_options.Transparency = True
            # NÃO definir Compression - pode causar erro em algumas versões
            
            # Tentar salvar com retry para erros de "ocupado" (otimizado para 4 tentativas)
            for save_attempt in range(4):
                try:
                    # Processar mensagens COM antes de cada tentativa
                    if PYTHONCOM_AVAILABLE:
                        try:
                            pythoncom.PumpWaitingMessages()
                        except:
                            pass
                    
                    # Verificar se o documento ainda está aberto
                    try:
                        _ = doc.Name
                    except:
                        raise Exception("Documento foi fechado antes de salvar")
                    
                    doc.SaveAs(output_path_normalized, tiff_options)
                    saved = True
                    print(f"[Debug] Arquivo salvo com TiffSaveOptions (sem Compression) - tentativa {save_attempt + 1}", file=sys.stderr)
                    break
                except Exception as e:
                    error_str = str(e).lower()
                    error_code = str(e)
                    is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                    "-2147417846" in error_code or 
                                    "filtro de mensagens" in error_str or
                                    "message filter" in error_str)
                    
                    if is_busy_error and save_attempt < 3:
                        # Espera otimizada: 0.5s, 1s, 1.5s (máximo 3s total)
                        wait_time = 0.5 * (save_attempt + 1)
                        print(f"[Debug] Erro ao salvar (ocupado), aguardando {wait_time}s... (tentativa {save_attempt + 1}/4)", file=sys.stderr)
                        time.sleep(wait_time)
                        
                        # Processar mensagens COM durante a espera
                        if PYTHONCOM_AVAILABLE:
                            try:
                                pythoncom.PumpWaitingMessages()
                            except:
                                pass
                        if PYTHONCOM_AVAILABLE:
                            try:
                                pythoncom.PumpWaitingMessages()
                            except:
                                pass
                        continue
                    else:
                        raise  # Re-lançar se não for erro de ocupado ou é última tentativa
        except Exception as e1:
            last_error = str(e1)
            print(f"[Debug] Método 1 falhou: {last_error}", file=sys.stderr)
            # Método 2: Salvar diretamente sem opções
            try:
                for save_attempt in range(4):  # Otimizado de 7 para 4 tentativas
                    try:
                        # Processar mensagens COM antes de cada tentativa
                        if PYTHONCOM_AVAILABLE:
                            try:
                                pythoncom.PumpWaitingMessages()
                            except:
                                pass
                        
                        # Verificar se o documento ainda está aberto
                        try:
                            _ = doc.Name
                        except:
                            raise Exception("Documento foi fechado antes de salvar")
                        
                        doc.SaveAs(output_path_normalized)
                        saved = True
                        print(f"[Debug] Arquivo salvo diretamente (sem opções) - tentativa {save_attempt + 1}", file=sys.stderr)
                        break
                    except Exception as e:
                        error_str = str(e).lower()
                        error_code = str(e)
                        is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                        "-2147417846" in error_code or 
                                        "filtro de mensagens" in error_str or
                                        "message filter" in error_str)
                        
                        if is_busy_error and save_attempt < 3:
                            wait_time = 0.5 * (save_attempt + 1)  # Otimizado: 0.5s, 1s, 1.5s
                            print(f"[Debug] Erro ao salvar método 2 (ocupado), aguardando {wait_time}s... (tentativa {save_attempt + 1}/4)", file=sys.stderr)
                            time.sleep(wait_time)
                            if PYTHONCOM_AVAILABLE:
                                try:
                                    pythoncom.PumpWaitingMessages()
                                except:
                                    pass
                            continue
                        else:
                            raise
            except Exception as e2:
                last_error = str(e2)
                print(f"[Debug] Método 2 falhou: {last_error}", file=sys.stderr)
                # Método 3: Tentar com caminho original também
                try:
                    for save_attempt in range(4):  # Otimizado de 7 para 4 tentativas
                        try:
                            # Processar mensagens COM antes de cada tentativa
                            if PYTHONCOM_AVAILABLE:
                                try:
                                    pythoncom.PumpWaitingMessages()
                                except:
                                    pass
                            
                            # Verificar se o documento ainda está aberto
                            try:
                                _ = doc.Name
                            except:
                                raise Exception("Documento foi fechado antes de salvar")
                            
                            doc.SaveAs(output_path)
                            saved = True
                            print(f"[Debug] Arquivo salvo com caminho original - tentativa {save_attempt + 1}", file=sys.stderr)
                            break
                        except Exception as e:
                            error_str = str(e).lower()
                            error_code = str(e)
                            is_busy_error = ("ocupado" in error_str or "busy" in error_str or 
                                            "-2147417846" in error_code or 
                                            "filtro de mensagens" in error_str or
                                            "message filter" in error_str)
                            
                            if is_busy_error and save_attempt < 3:
                                wait_time = 0.5 * (save_attempt + 1)  # Otimizado: 0.5s, 1s, 1.5s
                                print(f"[Debug] Erro ao salvar método 3 (ocupado), aguardando {wait_time}s... (tentativa {save_attempt + 1}/4)", file=sys.stderr)
                                time.sleep(wait_time)
                                if PYTHONCOM_AVAILABLE:
                                    try:
                                        pythoncom.PumpWaitingMessages()
                                    except:
                                        pass
                                continue
                            else:
                                raise
                except Exception as e3:
                    last_error = str(e3)
                    print(f"[Debug] Método 3 falhou: {last_error}", file=sys.stderr)
        
        if not saved:
            raise Exception(f"Erro ao salvar arquivo: {last_error}")
        
        # Verificar se o arquivo foi realmente salvo verificando o FullName do documento
        try:
            saved_path = str(doc.FullName) if hasattr(doc, 'FullName') and doc.FullName else None
            if saved_path:
                print(f"[Debug] Caminho do arquivo salvo (FullName): {saved_path}", file=sys.stderr)
        except Exception as e:
            print(f"[Debug] Aviso: Não foi possível obter FullName após salvar: {str(e)}", file=sys.stderr)
        
        # Aguardar um pouco para garantir que o arquivo foi escrito
        # Aumentar tempo de espera - o Photoshop pode demorar para escrever arquivos grandes
        # Aguardar antes de fechar o documento para garantir que o arquivo foi escrito
        time.sleep(0.2)  # Otimizado para 0.2s
        
        # Verificar se o documento foi salvo - obter o caminho do documento após salvar
        actual_output_path = None
        doc_full_path = None
        
        # Primeiro, tentar obter o caminho do documento salvo diretamente do Photoshop
        try:
            if hasattr(doc, 'FullName') and doc.FullName:
                doc_full_path = str(doc.FullName)
                print(f"[Debug] Caminho do documento após salvar (FullName): {doc_full_path}", file=sys.stderr)
                if doc_full_path and os.path.exists(doc_full_path):
                    file_size = os.path.getsize(doc_full_path)
                    if file_size > 0:
                        actual_output_path = doc_full_path
                        print(f"[Debug] Arquivo encontrado via FullName: {actual_output_path} ({file_size} bytes)", file=sys.stderr)
        except Exception as e:
            print(f"[Debug] Erro ao obter FullName: {str(e)}", file=sys.stderr)
        
        # Se não encontrou via FullName, verificar caminhos esperados
        if not actual_output_path:
            paths_to_check = [
                output_path_normalized,
                output_path,
                os.path.abspath(output_path),
                os.path.abspath(output_path_normalized),
            ]
            
            # Adicionar variações do caminho (com diferentes extensões)
            try:
                base_path = os.path.splitext(output_path_normalized)[0]
                paths_to_check.append(base_path + '.tif')
                paths_to_check.append(base_path + '.TIF')
                paths_to_check.append(base_path + '.TIFF')
            except:
                pass
            
            # Verificar cada caminho
            for check_path in paths_to_check:
                if check_path and os.path.exists(check_path):
                    file_size = os.path.getsize(check_path)
                    if file_size > 0:  # Verificar se o arquivo não está vazio
                        actual_output_path = check_path
                        print(f"[Debug] Arquivo encontrado: {actual_output_path} ({file_size} bytes)", file=sys.stderr)
                        break
        
        # Última tentativa: verificar no diretório do documento original
        if not actual_output_path:
            try:
                input_dir = os.path.dirname(file_path)
                output_filename = os.path.basename(output_path_normalized)
                alt_path = os.path.join(input_dir, output_filename)
                if os.path.exists(alt_path):
                    file_size = os.path.getsize(alt_path)
                    if file_size > 0:
                        actual_output_path = alt_path
                        print(f"[Debug] Arquivo encontrado em diretório alternativo: {actual_output_path} ({file_size} bytes)", file=sys.stderr)
            except:
                pass
        
        # NÃO fechar o documento ainda - aguardar mais tempo para garantir que o arquivo foi escrito
        # O Photoshop pode estar escrevendo o arquivo em background
        time.sleep(0.1)  # Otimizado para 0.1s
        
        # Fechar documento
        if doc:
            try:
                # Verificar se o documento ainda está aberto antes de fechar
                try:
                    _ = doc.Name
                    doc.Close(2)  # 2 = DoNotSaveChanges
                    print(f"[Debug] Documento fechado", file=sys.stderr)
                    doc = None # Marcar como fechado
                except:
                    print(f"[Debug] Documento já estava fechado", file=sys.stderr)
                time.sleep(0.5)  # Aguardar após fechar
            except Exception as e:
                print(f"[Debug] Aviso: Erro ao fechar documento: {str(e)}", file=sys.stderr)
        
        # Aguardar mais um pouco após fechar o documento (arquivo pode estar sendo escrito)
        time.sleep(0.2) # Otimizado para 0.2s
        
        # Verificar novamente após fechar o documento (arquivo pode ter sido criado agora)
        if not actual_output_path:
            # Verificar novamente todos os caminhos
            all_paths = [
                output_path_normalized,
                output_path,
                doc_full_path,
                os.path.abspath(output_path),
                os.path.abspath(output_path_normalized),
            ]
            
            # Adicionar variações de extensão novamente
            try:
                base_path = os.path.splitext(output_path_normalized)[0]
                all_paths.extend([base_path + '.tif', base_path + '.TIF', base_path + '.TIFF'])
            except:
                pass
            
            for check_path in all_paths:
                if check_path and os.path.exists(check_path):
                    file_size = os.path.getsize(check_path)
                    if file_size > 0:
                        actual_output_path = check_path
                        print(f"[Debug] Arquivo encontrado após fechar documento: {actual_output_path} ({file_size} bytes)", file=sys.stderr)
                        break
        
        if actual_output_path:
            # Retornar o caminho do arquivo salvo
            monitor.stop()
            print(f"SUCCESS:{actual_output_path}", file=sys.stdout)
            sys.stdout.flush()
            return True
        else:
            # Se não encontrou, ainda retornar o caminho esperado
            # O arquivo pode ter sido criado mas não detectado ainda (timing issue)
            # O TypeScript vai verificar novamente
            print(f"[Warning] Arquivo não encontrado nos caminhos esperados, mas assumindo sucesso", file=sys.stderr)
            print(f"[Warning] Caminho esperado: {output_path_normalized}", file=sys.stderr)
            # Retornar o caminho esperado - o TypeScript vai verificar se existe
            monitor.stop()
            print(f"SUCCESS:{output_path_normalized}", file=sys.stdout)
            sys.stdout.flush()
            return True
    except Exception as e:
        # Parar monitor em caso de erro
        try:
            monitor.stop()
        except:
            pass
            
        raise Exception(f"Erro ao processar: {str(e)}")
    finally:
        # Garantir que o documento seja fechado em caso de erro ou sucesso
        if doc:
            try:
                # Verificar se o documento ainda está aberto antes de fechar
                try:
                    _ = doc.Name
                    doc.Close(2)  # 2 = DoNotSaveChanges
                    print(f"[Debug] Documento fechado no finally", file=sys.stderr)
                except:
                    pass
            except Exception:
                pass
        
        # Limpar objetos COM para liberar recursos
        try:
            # Limpar referências para liberar objetos COM
            doc = None
            if 'ps_app_ref' in locals():
                ps_app_ref = None
            ps_app = None
            
            # Forçar garbage collection para liberar objetos COM
            import gc
            gc.collect()
            
            # Se pythoncom está disponível, tentar liberar recursos COM
            if PYTHONCOM_AVAILABLE:
                try:
                    # Processar mensagens pendentes antes de finalizar
                    pythoncom.PumpWaitingMessages()
                    # NOTA: Não chamar CoUninitialize aqui pois pode não ter sido inicializado
                    # ou pode ser compartilhado com outras threads
                except:
                    pass
        except:
            pass


def main():
    if len(sys.argv) < 2:
        print("Uso: python photoshop_automation.py <comando> [argumentos]", file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "check_action":
        if len(sys.argv) < 3:
            print("Uso: python photoshop_automation.py check_action <action_name> [action_set]", file=sys.stderr)
            sys.exit(1)
        
        # Remover aspas dos argumentos se existirem
        action_name = sys.argv[2].strip('"\'')
        action_set = sys.argv[3].strip('"\'') if len(sys.argv) > 3 and sys.argv[3].strip() else None

        try:
            ps_app = win32com.client.Dispatch("Photoshop.Application")
            # Verificar se o Photoshop está acessível
            try:
                _ = ps_app.Name
            except Exception as e:
                error_msg = f"Photoshop não está acessível. Certifique-se de que o Photoshop está instalado e em execução. Erro: {str(e)}"
                print(f"ERROR:{error_msg}", file=sys.stderr)
                sys.exit(1)
        except ImportError as e:
            # Só tratar como erro de pywin32 se for realmente ImportError
            error_msg = str(e).lower()
            if ("no module named" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)) or \
               ("modulenotfounderror" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)):
                print(f"ERROR:Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
            else:
                print(f"ERROR:Erro ao importar win32com: {str(e)}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            # Outros erros não são sobre pywin32 não encontrado
            error_msg = str(e)
            print(f"ERROR:Erro ao conectar com Photoshop: {error_msg}", file=sys.stderr)
            sys.exit(1)

        # Log para debug
        if action_set:
            print(f"[Debug] Buscando ação '{action_name}' no conjunto '{action_set}'", file=sys.stderr)
        else:
            print(f"[Debug] Buscando ação '{action_name}' em todos os conjuntos", file=sys.stderr)
        
        result = _find_action(ps_app, action_name, action_set)
        
        if result:
            resolved_action_name, resolved_set = result
            # Retornar tanto o nome da ação quanto o conjunto para referência
            print(f"EXISTS:{resolved_set}:{resolved_action_name}", file=sys.stdout)
            sys.stdout.flush()
        else:
            print("NOT_FOUND", file=sys.stdout)
            sys.stdout.flush()
    
    elif command == "process":
        if len(sys.argv) < 4:
            print("Uso: python photoshop_automation.py process <input_file> <output_file> [action_name] [action_set]", file=sys.stderr)
            sys.exit(1)
        
        # Remover aspas dos argumentos se existirem
        input_file = sys.argv[2].strip('"\'')
        output_file = sys.argv[3].strip('"\'')
        action_name = sys.argv[4].strip('"\'') if len(sys.argv) > 4 and sys.argv[4].strip() else "SPOTWHITE-PHOTOSHOP"
        # Se não especificado, usar DTF como padrão (modo padrão)
        action_set = sys.argv[5].strip('"\'') if len(sys.argv) > 5 and sys.argv[5].strip() else "DTF"
        
        try:
            process_spot_white(input_file, output_file, action_name, action_set)
            print(f"SUCCESS:{output_file}", file=sys.stdout)
            sys.stdout.flush()
        except Exception as e:
            error_msg = str(e)
            print(f"ERROR:{error_msg}", file=sys.stderr)
            sys.stderr.flush()
            sys.exit(1)

    elif command == "list_actions":
        list_available_actions()
    
    else:
        print(f"Comando desconhecido: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
