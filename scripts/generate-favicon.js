import fs from 'fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import path from 'path';

async function generateFavicon() {
  try {
    console.log('Reading SVG...');
    const svgPath = path.join(process.cwd(), 'src/app/icon.svg');
    const svgBuffer = await fs.readFile(svgPath);

    console.log('Converting SVG to PNG using sharp...');
    const pngBuffer = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();

    console.log('Converting PNG to ICO...');
    const icoBuffer = await pngToIco(pngBuffer);

    const destPath = path.join(process.cwd(), 'public/favicon.ico');
    await fs.writeFile(destPath, icoBuffer);
    
    // Also save in src/app just in case
    const appPath = path.join(process.cwd(), 'src/app/favicon.ico');
    await fs.writeFile(appPath, icoBuffer);

    console.log('Favicon generated successfully at public/favicon.ico and src/app/favicon.ico');
  } catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
