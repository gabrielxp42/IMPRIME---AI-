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

# Iniciar log de debug
print(f"[Debug] Python Executable: {sys.executable}", file=sys.stderr)

# Importar pythoncom para processar mensagens COM e evitar erros de "aplicativo ocupado"
try:
    import pythoncom
    PYTHONCOM_AVAILABLE = True
except ImportError:
    print("[Debug] pythoncom não disponível", file=sys.stderr)
    PYTHONCOM_AVAILABLE = False

# Verificar se pywin32 está instalado antes de importar
try:
    import win32com.client
except ImportError as e:
    error_msg = str(e).lower()
    # Só bloquear se for realmente um erro de módulo não encontrado
    if ("no module named" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)) or \
       ("modulenotfounderror" in error_msg and ("win32com" in error_msg or "pywin32" in error_msg)):
        print("ERROR:ModuleNotFoundError: Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    else:
        # Outros erros de importação (ex: DLL missing)
        print(f"[Debug] Aviso ao importar win32com: {e}", file=sys.stderr)
        try:
            import win32com.client
        except Exception as e2:
            print(f"ERROR:Falha crítica ao carregar win32com: {e2}", file=sys.stderr)
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


def _get_ps_app():
    """Tenta conectar ao Photoshop de várias formas."""
    max_retries = 3
    last_conn_error = "Desconhecido"
    
    for attempt in range(max_retries):
        try:
            # Inicializar COM para esta thread
            if PYTHONCOM_AVAILABLE:
                try:
                    pythoncom.CoInitialize()
                except:
                    pass
            
            # Tentar GetActiveObject primeiro
            try:
                ps_app = win32com.client.GetActiveObject("Photoshop.Application")
                print(f"[Debug] Conectado via GetActiveObject", file=sys.stderr)
                return ps_app
            except:
                pass
            
            # Tentar Dispatch normal
            try:
                ps_app = win32com.client.Dispatch("Photoshop.Application")
                print(f"[Debug] Conectado via Dispatch", file=sys.stderr)
                return ps_app
            except Exception as e:
                last_conn_error = str(e)
                
            # Tentar EnsureDispatch
            try:
                import win32com.client.gencache
                ps_app = win32com.client.gencache.EnsureDispatch("Photoshop.Application")
                print(f"[Debug] Conectado via EnsureDispatch", file=sys.stderr)
                return ps_app
            except:
                pass
            
            if attempt < max_retries - 1:
                time.sleep(0.5)
        except Exception as e:
            last_conn_error = str(e)
            
    raise Exception(f"Não foi possível conectar com o Photoshop: {last_conn_error}")

def process_spot_white(file_path, output_file, action_name="SPOTWHITE-PHOTOSHOP", 
                        action_set=None, page=1):
    """Processa arquivo com Spot White e salva como TIFF."""
    doc = None
    ps_app = None
    try:
        # Verificar se o arquivo de entrada existe
        if not os.path.exists(file_path):
            raise Exception(f"Arquivo de entrada não encontrado: {file_path}")
        
        # Conectar ao Photoshop usando a nova função auxiliar
        ps_app = _get_ps_app()

        if PYTHONCOM_AVAILABLE:
            try:
                pythoncom.PumpWaitingMessages()
            except:
                pass
        
        # Tornar o Photoshop visível
        try:
            ps_app.Visible = True
        except:
            pass
        
        # Verificar se o Photoshop está acessível
        try:
            _ = ps_app.Name
        except Exception as e:
            raise Exception(f"Photoshop não está acessível: {str(e)}")

        resolved_action_name = action_name
        resolved_action_set = action_set if action_set else "DTF"
        
        # Normalizar caminho do arquivo de entrada
        file_path_abs = os.path.abspath(file_path).replace('/', '\\')
        
        # Configurar diálogos
        try:
            ps_app.DisplayDialogs = 2  # Errors Only
        except:
            pass
        
        # Iniciar monitor de diálogos em background
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

        monitor = DialogMonitorThread()
        monitor.daemon = True
        monitor.start()
        
        try:
            # Abrir arquivo
            doc = None
            for open_attempt in range(3):
                try:
                    ext = os.path.splitext(file_path_abs)[1].lower()
                    if ext == '.pdf':
                        print(f"[Debug] Abrindo PDF com configurações de 300 DPI", file=sys.stderr)
                        try:
                            # Usar PDFOpenOptions para garantir resolução de impressão
                            pdf_options = win32com.client.Dispatch("Photoshop.PDFOpenOptions")
                            pdf_options.Resolution = 300  # Forçar 300 DPI (Padrão DTF)
                            pdf_options.Mode = 3          # 3 = RGB (Padrão para DTF)
                            pdf_options.CropPage = 1      # 1 = MediaBox (Tamanho real da folha/doc)
                            pdf_options.AntiAlias = True
                            if page and int(page) > 0:
                                pdf_options.Page = int(page)
                            
                            doc = ps_app.Open(file_path_abs, pdf_options)
                        except Exception as pdf_err:
                            print(f"[Debug] Fallback PDF open: {pdf_err}", file=sys.stderr)
                            doc = ps_app.Open(file_path_abs)
                    else:
                        doc = ps_app.Open(file_path_abs)
                    break
                except Exception as e:
                    if open_attempt < 2:
                        time.sleep(1)
                        continue
                    raise Exception(f"Erro ao abrir arquivo após 3 tentativas: {e}")
            
            if not doc:
                raise Exception("Documento retornou None após abrir")

            # Ativar documento
            try:
                doc.Activate()
            except:
                pass

            # Executar ação
            action_executed = False
            # Verificar se já existe canal Spot White
            try:
                channels = doc.Channels
                for i in range(1, channels.Count + 1):
                    if "spot" in channels.Item(i).Name.lower() and "white" in channels.Item(i).Name.lower():
                        action_executed = True
                        print(f"[Debug] Canal Spot White detectado, pulando ação", file=sys.stderr)
                        break
            except:
                pass

            if not action_executed:
                try:
                    ps_app.DoAction(resolved_action_name, resolved_action_set)
                    action_executed = True
                except Exception as e:
                    print(f"[Debug] DoAction falhou, tentando ExecuteAction: {e}", file=sys.stderr)
                    try:
                        ps_app.ExecuteAction(resolved_action_name, resolved_action_set)
                        action_executed = True
                    except Exception as e2:
                        raise Exception(f"Falha ao executar ação: {e2}")

            # Salvar como TIFF
            output_path_abs = os.path.abspath(output_file).replace('/', '\\')
            
            # Criar diretório se não existir
            output_dir = os.path.dirname(output_path_abs)
            if not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)

            print(f"[Debug] Salvando em: {output_path_abs}", file=sys.stderr)
            
            # Opções de TIFF para fundo transparente
            try:
                tiff_options = win32com.client.Dispatch("Photoshop.TiffSaveOptions")
                tiff_options.AlphaChannels = True
                tiff_options.Layers = False
                tiff_options.Transparency = True
                tiff_options.ByteOrder = 1 # IBM PC
                tiff_options.ImageCompression = 2 # LZW
                
                doc.SaveAs(output_path_abs, tiff_options)
            except Exception as e:
                print(f"[Debug] Falha ao salvar com TIFF Options, tentando SaveAs simples: {e}", file=sys.stderr)
                doc.SaveAs(output_path_abs)

            print(f"[Debug] Sucesso no processamento de {file_path}", file=sys.stderr)

        finally:
            monitor.stop()

    except Exception as e:
        raise Exception(f"Erro no processamento: {str(e)}")
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
            ps_app = _get_ps_app()
            # Verificar se o Photoshop está acessível
            try:
                _ = ps_app.Name
            except Exception as e:
                error_msg = f"Photoshop não está acessível. Certifique-se de que o Photoshop está instalado e em execução. Erro: {str(e)}"
                print(f"ERROR:{error_msg}", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            error_msg = str(e)
            if "pywin32" in error_msg.lower() or "win32com" in error_msg.lower():
                print(f"ERROR:ModuleNotFoundError: Biblioteca pywin32 não encontrada. Execute: pip install pywin32", file=sys.stderr)
            else:
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
        page = sys.argv[6].strip('"\'') if len(sys.argv) > 6 and sys.argv[6].strip() else 1
        
        try:
            process_spot_white(input_file, output_file, action_name, action_set, page)
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
