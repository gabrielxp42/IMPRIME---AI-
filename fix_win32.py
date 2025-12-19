import os
import shutil
import sys
import win32com

# Tentar localizar a pasta gen_py
try:
    gen_py_path = os.path.join(os.path.dirname(win32com.__file__), "gen_py")
    print(f"Procurando em: {gen_py_path}")
    
    if os.path.exists(gen_py_path):
        print(f"Removendo cache corrompido em: {gen_py_path}")
        shutil.rmtree(gen_py_path)
        print("Cache removido com sucesso!")
    else:
        # Tenta o caminho do usuário %TEMP%/gen_py
        user_temp = os.environ.get('TEMP', '')
        gen_py_user = os.path.join(user_temp, 'gen_py')
        print(f"Procurando em: {gen_py_user}")
        if os.path.exists(gen_py_user):
             print(f"Removendo cache de usuário em: {gen_py_user}")
             shutil.rmtree(gen_py_user)
             print("Cache removido!")
        else:
             print("Pasta gen_py não encontrada nos locais padrão.")

except Exception as e:
    print(f"Erro ao limpar: {e}")
