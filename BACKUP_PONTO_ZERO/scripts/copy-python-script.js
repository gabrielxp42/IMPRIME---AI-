const fs = require('fs');
const path = require('path');

// Copiar script Python para dist/ (mesmo diretório do main.js compilado)
const sourcePath = path.join(__dirname, '../src/main/photoshop_automation.py');
const destPath = path.join(__dirname, '../dist/photoshop_automation.py');

// Criar diretório dist se não existir
const distDir = path.dirname(destPath);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copiar arquivo
// Função para copiar arquivo
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`✓ Arquivo copiado: ${path.basename(dest)}`);
    } catch (error) {
      console.error(`✗ Erro ao copiar ${path.basename(src)}:`, error.message);
      process.exit(1);
    }
  } else {
    console.warn(`⚠ Arquivo não encontrado: ${src}`);
  }
}

// Copiar photoshop_automation.py
copyFile(
  path.join(__dirname, '../src/main/photoshop_automation.py'),
  path.join(__dirname, '../dist/photoshop_automation.py')
);

// Copiar background_remover.py
copyFile(
  path.join(__dirname, '../src/main/background_remover.py'),
  path.join(__dirname, '../dist/background_remover.py')
);


