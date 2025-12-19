const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  const distDir = path.dirname(dest);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ ${path.basename(dest)}`);
  } else {
    console.warn(`⚠ Não encontrado: ${src}`);
  }
}

console.log('📋 Copiando scripts Python...');

// Spot White
copyFile(
  path.join(__dirname, '../src/main/modules/spotwhite/scripts/photoshop_automation.py'),
  path.join(__dirname, '../dist/photoshop_automation.py')
);

// Upscayl
copyFile(
  path.join(__dirname, '../src/main/modules/upscayl/scripts/background_remover.py'),
  path.join(__dirname, '../dist/background_remover.py')
);

copyFile(
  path.join(__dirname, '../src/main/modules/upscayl/scripts/background_remover_highprecision.py'),
  path.join(__dirname, '../dist/background_remover_highprecision.py')
);

copyFile(
  path.join(__dirname, '../src/main/modules/upscayl/scripts/background_remover_manual.py'),
  path.join(__dirname, '../dist/background_remover_manual.py')
);

copyFile(
  path.join(__dirname, '../src/main/modules/upscayl/scripts/background_remover_sam.py'),
  path.join(__dirname, '../dist/background_remover_sam.py')
);

console.log('✅ Concluído!');
