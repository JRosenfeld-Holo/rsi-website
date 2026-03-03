import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legacyDir = path.join(__dirname, 'legacy-images');
const logosDir = path.join(__dirname, 'public', 'logos');
const dataDir = path.join(__dirname, 'src', 'data');

if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const files = fs.readdirSync(legacyDir);
const logos = [];

// Filtering heuristics: transparent PNG files under 100KB are usually logos
// Exclude files that look like UI/background placeholders if any obvious ones exist
files.forEach(file => {
    if (file.endsWith('.png')) {
        const filePath = path.join(legacyDir, file);
        const stats = fs.statSync(filePath);

        if (stats.size > 1000 && stats.size < 100000) {
            // copy to public/logos
            const destName = file.replace(/_mv2/, ''); // clean up wix suffix
            fs.copyFileSync(filePath, path.join(logosDir, destName));
            logos.push(`/logos/${destName}`);
        }
    }
});

fs.writeFileSync(path.join(dataDir, 'logos.json'), JSON.stringify(logos, null, 2));

console.log(`Copied ${logos.length} logos to public/logos/ and created logos.json`);
