const fs = require('fs');
const path = require('path');

function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  fs.readdirSync(dirPath).forEach((file) => {
    const curPath = path.join(dirPath, file);
    if (fs.lstatSync(curPath).isDirectory()) {
      removeDir(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  });
  fs.rmdirSync(dirPath);
}

// Diretórios para limpar
// NÃO remover 'release' aqui - o electron-builder precisa criar os executáveis lá
const dirsToClean = [
  'dist',
  path.join('node_modules', '.vite'),
  path.join('node_modules', '.cache'),
  '.vite',
];

console.log('🧹 Limpando diretórios de build...');

dirsToClean.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`  Removendo: ${dir}`);
    removeDir(dir);
  }
});

console.log('✅ Limpeza concluída!');
