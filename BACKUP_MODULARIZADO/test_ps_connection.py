import win32com.client
import sys
import os

print(f"Python executando: {sys.executable}")
print(f"Diretório atual: {os.getcwd()}")

try:
    print("Tentando conectar ao Photoshop...")
    ps_app = win32com.client.Dispatch("Photoshop.Application")
    print(f"SUCESSO! Conectado ao Photoshop: {ps_app.Name}")
    print(f"Versão: {ps_app.Version}")
    
    if ps_app.Documents.Count > 0:
        print(f"Documento ativo: {ps_app.ActiveDocument.Name}")
    else:
        print("Nenhum documento aberto (mas conexão ok)")
        
except Exception as e:
    print(f"ERRO CRÍTICO: Não foi possível conectar ao Photoshop.")
    print(f"Detalhes: {e}")
