import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.retailsitesinc.com';
const START_URL = BASE_URL;

async function fetchPage(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        return data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

function extractText(html) {
    const $ = cheerio.load(html);

    $('script, style, noscript, header, footer, nav, [role="navigation"]').remove();
    $('br').replaceWith(' ');

    const text = $('body').text()
        .replace(/\s+/g, ' ')
        .trim();

    return text;
}

async function scrapePages() {
    console.log('Fetching Home page...');
    const homeHtml = await fetchPage(START_URL);

    if (!homeHtml) {
        console.error('Failed to fetch home page.');
        return;
    }

    const $ = cheerio.load(homeHtml);

    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim().toLowerCase();
        if (href) {
            links.push({ href, text });
        }
    });

    const targetPages = {
        'Home': START_URL,
        'About Us': null,
        'Team': null,
        'Services': null
    };

    const findLink = (keywords) => {
        for (const link of links) {
            for (const kw of keywords) {
                if (link.text.includes(kw) || link.href.toLowerCase().includes(kw)) {
                    return link.href.startsWith('http') ? link.href : new URL(link.href, BASE_URL).href;
                }
            }
        }
        return null;
    };

    targetPages['About Us'] = findLink(['about']) || `${BASE_URL}/about-us`;
    targetPages['Team'] = findLink(['team']) || `${BASE_URL}/our-team`;
    targetPages['Services'] = findLink(['services']) || `${BASE_URL}/services`;

    const result = {};

    for (const [name, url] of Object.entries(targetPages)) {
        console.log(`Scraping ${name} from ${url}...`);
        const html = await fetchPage(url);
        if (html) {
            result[name] = extractText(html);
        } else {
            console.log(`Failed to find/scrape ${name} at ${url}. Trying fallbacks...`);
            const fallbacks = {
                'About Us': `${BASE_URL}/about`,
                'Team': `${BASE_URL}/about-us`,
                'Services': `${BASE_URL}/services`
            };

            if (fallbacks[name] && fallbacks[name] !== url) {
                console.log(`Trying ${fallbacks[name]}...`);
                const fbHtml = await fetchPage(fallbacks[name]);
                if (fbHtml) {
                    result[name] = extractText(fbHtml);
                } else {
                    result[name] = "Content not found.";
                }
            } else {
                result[name] = "Content not found.";
            }
        }
    }

    const outputPath = path.join(__dirname, 'rsi-content.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nSuccessfully scraped content and saved to ${outputPath}`);
}

scrapePages();
