import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source et destination des fichiers de traduction
const sourceDir = path.join(__dirname, '../src/locales');
const destDir = path.join(__dirname, '../public/locales');

// Créer le dossier de destination s'il n'existe pas
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copier tous les fichiers JSON
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const sourceFile = path.join(sourceDir, file);
    const destFile = path.join(destDir, file);
    fs.copyFileSync(sourceFile, destFile);
    console.log(`Copied ${file} to public/locales/`);
  }
});

console.log('Translation files copied successfully!');
