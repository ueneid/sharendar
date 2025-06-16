const fs = require('fs');
const path = require('path');

// SVGをPNGに変換するためのシンプルなスクリプト
// Canvasを使用してSVGをレンダリング

const { createCanvas, loadImage } = require('canvas');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // SVGをdata URLに変換
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
  
  try {
    const img = await loadImage(svgDataUrl);
    
    // 192x192のアイコンを生成
    const canvas192 = createCanvas(192, 192);
    const ctx192 = canvas192.getContext('2d');
    ctx192.drawImage(img, 0, 0, 192, 192);
    
    const buffer192 = canvas192.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), buffer192);
    console.log('icon-192.png generated');
    
    // 512x512のアイコンを生成
    const canvas512 = createCanvas(512, 512);
    const ctx512 = canvas512.getContext('2d');
    ctx512.drawImage(img, 0, 0, 512, 512);
    
    const buffer512 = canvas512.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), buffer512);
    console.log('icon-512.png generated');
    
    // 32x32のfaviconを生成
    const canvas32 = createCanvas(32, 32);
    const ctx32 = canvas32.getContext('2d');
    ctx32.drawImage(img, 0, 0, 32, 32);
    
    const buffer32 = canvas32.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/favicon-32x32.png'), buffer32);
    console.log('favicon-32x32.png generated');
    
    // 16x16のfaviconを生成
    const canvas16 = createCanvas(16, 16);
    const ctx16 = canvas16.getContext('2d');
    ctx16.drawImage(img, 0, 0, 16, 16);
    
    const buffer16 = canvas16.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/favicon-16x16.png'), buffer16);
    console.log('favicon-16x16.png generated');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };