import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.retailsitesinc.com';
const URLS = [
    BASE_URL,
    `${BASE_URL}/about-us`,
    `${BASE_URL}/our-team`,
    `${BASE_URL}/services`
];

const DIR = path.join(__dirname, 'legacy-images');

if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

async function downloadImage(url, filename) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        const filePath = path.join(DIR, filename);
        fs.writeFileSync(filePath, response.data);
        console.log(`Downloaded: ${filename}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`Skipped 404: ${url}`);
        } else {
            console.error(`Failed to download ${url}: ${error.message}`);
        }
    }
}

function getFilenameFromUrl(imgUrl, index) {
    try {
        // Some URLs (Wix) look like https://static.wixstatic.com/media/xxx.jpg/v1/fill/...
        // Let's grab the part right after /media/ if possible
        let cleanUrl = imgUrl.split('?')[0];

        // Attempt to extract the primary image name from Wix-like CDN URLs
        const mediaMatch = cleanUrl.match(/\/media\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/);
        let baseName = '';

        if (mediaMatch && mediaMatch[1]) {
            baseName = mediaMatch[1];
        } else {
            const urlObj = new URL(cleanUrl);
            baseName = path.basename(urlObj.pathname);
        }

        if (!baseName || !baseName.includes('.')) {
            baseName = `image-${index}.jpg`;
        }

        // Sanitize filename
        baseName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Fallback if the extracted name is too weird
        if (baseName.length > 60) {
            const ext = path.extname(baseName) || '.jpg';
            baseName = `fallback_img${ext}`;
        }

        return `rsi_${String(index).padStart(2, '0')}_${baseName}`;
    } catch (e) {
        return `rsi_${String(index).padStart(2, '0')}_image.jpg`;
    }
}

async function scrapeImages() {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const imageUrls = new Set();

    for (const pageUrl of URLS) {
        console.log(`Navigating to ${pageUrl}...`);
        const page = await browser.newPage();
        try {
            // Set viewport for a decent desktop size
            await page.setViewport({ width: 1440, height: 900 });
            const response = await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            if (!response.ok()) {
                console.log(`Page returned status ${response.status()}, skipping...`);
                continue;
            }

            console.log(`Scrolling ${pageUrl} to load lazy images...`);
            // Auto-scroll to load lazy images
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    let distance = 300;
                    let timer = setInterval(() => {
                        let scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight - window.innerHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 150);
                });
            });

            // Give it a tiny bit extra time to render the final scrolled-to images
            await new Promise(r => setTimeout(r, 2000));

            // Extract images
            const extracted = await page.evaluate(() => {
                const urls = new Set();

                // img tags
                document.querySelectorAll('img').forEach(img => {
                    // Check standard src and common lazy-loading attributes
                    const sources = [img.src, img.dataset.src, img.getAttribute('data-src'), img.currentSrc];
                    sources.forEach(src => {
                        if (src && src.startsWith('http') && !src.includes('data:image')) {
                            urls.add(src);
                        }
                    });
                });

                // Background images
                document.querySelectorAll('*').forEach(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    if (bg && bg !== 'none') {
                        const matches = bg.matchAll(/url\(['"]?(.*?)['"]?\)/g);
                        for (const match of matches) {
                            if (match[1] && match[1].startsWith('http') && !match[1].includes('data:image')) {
                                urls.add(match[1]);
                            }
                        }
                    }
                });

                return Array.from(urls);
            });

            console.log(`Found ${extracted.length} raw image URLs on ${pageUrl} (pre-deduplication).`);

            extracted.forEach(url => {
                // Exclude tracking pixels / empty transparent gifts / common generic stuff
                if (!url.includes('bat.bing.com') &&
                    !url.includes('google-analytics') &&
                    !url.includes('facebook.com/tr')) {

                    // Optionally, trick Wix into returning standard original image
                    // Wix CDN resizing params look like: /v1/fill/w_316,h_316,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/img.jpg
                    // We can strip the /v1/fill... trailing part to get the original if it follows that structure,
                    // but downloading the size they serve to desktop is usually fine and high-res enough.

                    imageUrls.add(url);
                }
            });

        } catch (e) {
            console.log(`Failed or no page at ${pageUrl}: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();

    console.log(`\nFound ${imageUrls.size} unique images across all pages.`);
    console.log(`Downloading to ${DIR} ...\n`);

    let i = 1;
    for (const url of imageUrls) {
        const filename = getFilenameFromUrl(url, i);
        await downloadImage(url, filename);
        i++;
    }

    console.log('\nAll downloads completed!');
}

scrapeImages();
