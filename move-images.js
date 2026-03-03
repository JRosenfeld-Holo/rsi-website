import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legacyDir = path.join(__dirname, 'legacy-images');
const imagesDir = path.join(__dirname, 'public', 'images');
const teamDir = path.join(imagesDir, 'team');

if (!fs.existsSync(teamDir)) {
    fs.mkdirSync(teamDir, { recursive: true });
}

// Map of identified team images
const teamImages = {
    'nathan-werner.jpg': 'rsi_05_IMG_0662_20-_20Version_202_JPG.jpg',
    'bill-bymel.jpg': 'rsi_06_bill-bymel-home-main.jpg',
    'paul-werner.jpg': 'rsi_63_IMG_0990_edited.jpg',
    'carol-heinrich.jpg': 'rsi_64_IMG-6520_20_1_.jpg',
    'ari-meltzer.jpg': 'rsi_65_548283_5bf625da030d445e837f818b7392630a_mv2.jpg',
    'sunny-chen.png': 'rsi_66_548283_1b9c6bdf99d741c1ab70ecb3dcbe47b7_mv2.png',
    'joel-chester.png': 'rsi_67_unnamed.png',
    'beverly-garcia.jpg': 'rsi_68_548283_7f14f862de23468b9f7544a47e9cef98_mv2.jpg'
};

// Copy team images
for (const [newName, oldName] of Object.entries(teamImages)) {
    const oldPath = path.join(legacyDir, oldName);
    const newPath = path.join(teamDir, newName);
    if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
        console.log(`Copied team image: ${newName}`);
    } else {
        // try fallback looking for the file globally
        const files = fs.readdirSync(legacyDir);
        const matched = files.find(f => f.includes(oldName.split('_').pop()));
        if (matched) {
            fs.copyFileSync(path.join(legacyDir, matched), newPath);
            console.log(`Copied team image (fallback match): ${newName}`);
        } else {
            console.log(`Missing team image: ${oldName}`);
        }
    }
}

// Identify potential project images
const projectImages = [
    'rsi_04_548283_8c52e6ae40954e128d4dd73ae9fefad3_mv2.jpg',
    'rsi_10_548283_24690ebfb8f1448f870e9c46ca588e97_mv2.jpg',
    'rsi_14_548283_40c30fb18d984d38aef490e3e098a424_mv2.jpg'
];

projectImages.forEach((img, index) => {
    const oldPath = path.join(legacyDir, img);
    if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, path.join(imagesDir, `project-${index + 1}.jpg`));
        console.log(`Copied project image ${index + 1}`);
    }
});

// Update rsi-content.json to point to correct extensions
const dataPath = path.join(__dirname, 'src', 'data', 'rsi-content.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

data.team.forEach(member => {
    if (member.id === 'sunny-chen' || member.id === 'joel-chester') {
        member.image = member.image.replace('.jpg', '.png');
    }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Updated rsi-content.json');
