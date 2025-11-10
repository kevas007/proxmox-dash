// Script pour copier les fichiers de traduction vers public/
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'src', 'locales');
const targetDir = path.join(__dirname, 'public', 'locales');

// Créer le dossier public/locales s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copier tous les fichiers .json
fs.readdirSync(sourceDir).forEach(file => {
  if (file.endsWith('.json')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copié: ${file}`);
  }
});

console.log('✨ Traductions copiées avec succès!');

