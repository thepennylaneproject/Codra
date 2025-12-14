
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = 'src/assets/images';
const TARGET_BASE = 'src/assets/codra';
const MANIFEST_PATH = 'src/assets/assets-manifest.json';

// Ensure directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Map source files to target structure
// Using specific target logic based on the file type and purpose
const assetsToProcess = [
    { src: 'hero_1.jpg', type: 'image', purpose: 'hero', variant: 'primary', scale: '1x' },
    { src: 'hero_2.jpg', type: 'image', purpose: 'hero', variant: 'secondary', scale: '1x' },
    { src: 'texture_1.jpg', type: 'image', purpose: 'texture', variant: 'circles', scale: '1x' },
    { src: 'texture_2.jpg', type: 'image', purpose: 'texture', variant: 'circuits', scale: '1x' },
    { src: 'mascot.jpg', type: 'image', purpose: 'illustration', variant: 'mascot', scale: '1x' },
    { src: 'spot_1.jpg', type: 'image', purpose: 'illustration', variant: 'spot_circuit', scale: '1x' },
    { src: 'spot_2.jpg', type: 'image', purpose: 'illustration', variant: 'spot_energy', scale: '1x' },
    { src: 'logo.jpg', type: 'image', purpose: 'brand', variant: 'logo', scale: '1x' },
];

async function processImages() {
    const manifestItems = [];

    ensureDir(TARGET_BASE);

    for (const asset of assetsToProcess) {
        const sourcePath = path.join(SOURCE_DIR, asset.src);
        if (!fs.existsSync(sourcePath)) {
            console.warn(`Source not found: ${sourcePath}`);
            continue;
        }

        const image = sharp(sourcePath);
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        // Construct target path: {project}/{asset-type}/{purpose}/{variant}/{w}x{h}@{scale}.{ext}
        // project is 'codra' (mapped to TARGET_BASE)
        const targetDir = path.join(TARGET_BASE, asset.type, asset.purpose, asset.variant);
        const filename = `${width}x${height}@${asset.scale}.webp`;
        ensureDir(targetDir);
        const targetPath = path.join(targetDir, filename);

        await image.webp({ quality: 90 }).toFile(targetPath);
        console.log(`Processed: ${asset.src} -> ${targetPath}`);

        manifestItems.push({
            type: asset.type,
            purpose: asset.purpose,
            variant: asset.variant,
            width,
            height,
            mimeType: 'image/webp',
            tags: [asset.purpose, asset.variant],
            intendedPlacement: asset.purpose === 'hero' ? 'landing-page' : 'ui-component',
            path: targetPath,
            importSnippet: `import ${asset.variant.toUpperCase()}_${asset.purpose.toUpperCase()} from '@/${targetPath.replace('src/', '')}';`
        });
    }

    return manifestItems;
}

async function extractSvg() {
    const svgContent = `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer circle with glow -->
    <circle cx="60" cy="60" r="58" stroke="#F4D03F" strokeWidth="1" opacity="0.3" />
    <!-- Concentric rings - Gold -->
    <circle cx="60" cy="60" r="50" stroke="#F4D03F" strokeWidth="2" />
    <circle cx="60" cy="60" r="42" stroke="#F4D03F" strokeWidth="1.5" opacity="0.8" />
    <circle cx="60" cy="60" r="34" stroke="#F4D03F" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="26" stroke="#F4D03F" strokeWidth="2" />
    <!-- Inner Teal accent circles -->
    <circle cx="60" cy="60" r="18" stroke="#00D9D9" strokeWidth="1.5" opacity="0.6" />
    <circle cx="60" cy="60" r="10" stroke="#00D9D9" strokeWidth="1" />
    <!-- Circuit nodes on outer ring - Gold -->
    <circle cx="110" cy="60" r="3.5" fill="#F4D03F" />
    <circle cx="95" cy="95" r="3" fill="#F4D03F" />
    <circle cx="60" cy="110" r="3.5" fill="#F4D03F" />
    <circle cx="25" cy="95" r="3" fill="#F4D03F" />
    <circle cx="10" cy="60" r="3.5" fill="#F4D03F" />
    <circle cx="25" cy="25" r="3" fill="#F4D03F" />
    <circle cx="60" cy="10" r="3.5" fill="#F4D03F" />
    <circle cx="95" cy="25" r="3" fill="#F4D03F" />
    <!-- Teal accent nodes -->
    <circle cx="85" cy="35" r="2" fill="#00D9D9" opacity="0.7" />
    <circle cx="35" cy="85" r="2" fill="#00D9D9" opacity="0.7" />
    <!-- Center dot -->
    <circle cx="60" cy="60" r="2" fill="#F4D03F" />
</svg>`;

    const targetDir = path.join(TARGET_BASE, 'icon', 'brand', 'logo');
    ensureDir(targetDir);
    const filename = '120x120@1x.svg';
    const targetPath = path.join(targetDir, filename);

    fs.writeFileSync(targetPath, svgContent);
    console.log(`Generated SVG: ${targetPath}`);

    return {
        type: 'icon',
        purpose: 'brand',
        variant: 'logo',
        width: 120,
        height: 120,
        mimeType: 'image/svg+xml',
        tags: ['logo', 'brand', 'icon'],
        intendedPlacement: 'header',
        path: targetPath,
        importSnippet: `import LOGO_SVG from '@/${targetPath.replace('src/', '')}';`
    };
}

async function main() {
    try {
        const imageItems = await processImages();
        const svgItem = await extractSvg();

        const manifest = {
            project: 'codra',
            generatedAt: new Date().toISOString(),
            assets: [...imageItems, svgItem]
        };

        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log(`Manifest written to ${MANIFEST_PATH}`);
    } catch (e) {
        console.error('Error processing assets:', e);
        process.exit(1);
    }
}

main();
