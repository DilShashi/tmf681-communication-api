// scripts/copy-swagger-assets.js
const fs = require('fs');
const path = require('path');

const assets = [
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js', 
  'swagger-ui.css'
];

const sourceDir = path.join(__dirname, '../node_modules/swagger-ui-dist');
const destDir = path.join(__dirname, '../public/swagger-ui');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  assets.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const destFile = path.join(destDir, file);
    
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
      console.log(`Copied ${file} to ${destDir}`);
    }
  });

  console.log('Swagger UI assets copied successfully');
} catch (err) {
  console.error('Error copying Swagger UI assets:', err);
  process.exit(1);
}