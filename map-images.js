import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URLS = [
    'https://www.retailsitesinc.com',
    'https://www.retailsitesinc.com/about-us'
];

async function mapImages() {
    for (const url of URLS) {
        console.log(`\nFetching ${url}...`);
        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(data);

            console.log('Images and surrounding text:');
            $('img').each((i, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src && !src.includes('data:image')) {
                    // get the text of the parent or preceding/following siblings to guess context
                    const parentText = $(el).parent().text().replace(/\s+/g, ' ').trim().substring(0, 50);
                    console.log(`[IMG] ${src.split('/').pop().split('?')[0]} -> Context: "${parentText}"`);
                }
            });
        } catch (e) {
            console.log(`Error fetching ${url}:`, e.message);
        }
    }
}

mapImages();
