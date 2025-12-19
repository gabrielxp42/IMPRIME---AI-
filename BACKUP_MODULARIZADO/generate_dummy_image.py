from PIL import Image
import os

img = Image.new('RGB', (100, 100), color = 'red')
img.save('test_dummy.png')
print("Imagem criada: test_dummy.png")
