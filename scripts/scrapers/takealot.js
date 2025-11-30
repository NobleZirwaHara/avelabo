/**
 * Takealot Scraper using Puppeteer
 *
 * This script scrapes products from Takealot.com
 * It is called from Laravel via the TakealotScraper service
 *
 * Usage: node takealot.js <action> <params_json>
 * Actions: scrape_category, scrape_product, scrape_all
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'https://www.takealot.com';

// Browser instance
let browser = null;
let page = null;

/**
 * Initialize the browser
 */
async function initBrowser() {
    browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080',
        ],
    });
    page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'media'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

/**
 * Close the browser
 */
async function closeBrowser() {
    if (browser) {
        await browser.close();
    }
}

/**
 * Wait for a random delay (human-like behavior)
 */
async function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Scrape a single product page
 */
async function scrapeProduct(productUrl) {
    try {
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(500, 1500);

        const product = await page.evaluate((baseUrl) => {
            const data = {
                source_id: null,
                source_url: window.location.href,
                name: null,
                description: null,
                short_description: null,
                specifications: null,
                price: null,
                compare_price: null,
                brand: null,
                category: null,
                sku: null,
                rating: null,
                reviews_count: null,
                images: [],
                stock_quantity: 100,
            };

            // Extract product ID from URL
            const urlMatch = window.location.href.match(/PLID(\d+)/);
            if (urlMatch) {
                data.source_id = urlMatch[1];
            }

            // Product name
            const nameEl = document.querySelector('h1[data-ref="product-title"]') ||
                          document.querySelector('h1.pdp-title') ||
                          document.querySelector('[class*="product-title"]');
            if (nameEl) {
                data.name = nameEl.textContent.trim();
            }

            // Price
            const priceEl = document.querySelector('[data-ref="buybox-price-main"]') ||
                           document.querySelector('[class*="buybox-module_price"]') ||
                           document.querySelector('[class*="price"] span');
            if (priceEl) {
                const priceText = priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '');
                data.price = parseFloat(priceText) || null;
            }

            // Compare/original price (strikethrough)
            const comparePriceEl = document.querySelector('[data-ref="buybox-price-old"]') ||
                                  document.querySelector('[class*="list-price"]') ||
                                  document.querySelector('[class*="was-price"]');
            if (comparePriceEl) {
                const comparePriceText = comparePriceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '');
                data.compare_price = parseFloat(comparePriceText) || null;
            }

            // Brand
            const brandEl = document.querySelector('[data-ref="brand-link"]') ||
                           document.querySelector('[class*="brand"] a');
            if (brandEl) {
                data.brand = brandEl.textContent.trim();
            }

            // Description
            const descEl = document.querySelector('[data-ref="product-description"]') ||
                          document.querySelector('[class*="product-description"]') ||
                          document.querySelector('[class*="description-module"]');
            if (descEl) {
                data.description = descEl.innerHTML;
                // Create short description from first paragraph
                const shortDesc = descEl.textContent.trim().substring(0, 250);
                data.short_description = shortDesc + (descEl.textContent.length > 250 ? '...' : '');
            }

            // Specifications
            const specsEl = document.querySelector('[data-ref="product-specifications"]') ||
                           document.querySelector('[class*="specifications"]');
            if (specsEl) {
                data.specifications = specsEl.innerHTML;
            }

            // Rating
            const ratingEl = document.querySelector('[data-ref="product-rating"]') ||
                            document.querySelector('[class*="star-rating"]');
            if (ratingEl) {
                const ratingText = ratingEl.textContent || ratingEl.getAttribute('data-rating');
                if (ratingText) {
                    data.rating = parseFloat(ratingText.match(/[\d.]+/)?.[0]) || 0;
                }
            }

            // Reviews count
            const reviewsEl = document.querySelector('[data-ref="reviews-count"]') ||
                             document.querySelector('[class*="reviews-count"]');
            if (reviewsEl) {
                const reviewsText = reviewsEl.textContent;
                data.reviews_count = parseInt(reviewsText.match(/\d+/)?.[0]) || 0;
            }

            // SKU
            const skuEl = document.querySelector('[data-ref="product-sku"]') ||
                         document.querySelector('[class*="sku"]');
            if (skuEl) {
                data.sku = skuEl.textContent.replace(/[^a-zA-Z0-9-]/g, '').trim();
            }

            // Images
            const imageEls = document.querySelectorAll('[data-ref="gallery-image"] img, [class*="gallery"] img, [class*="product-image"] img');
            imageEls.forEach(img => {
                let src = img.getAttribute('data-src') || img.getAttribute('src');
                if (src && !src.includes('placeholder')) {
                    // Get high-res version
                    src = src.replace(/pdpxs|pdps|pdpm/g, 'pdpxl');
                    if (!data.images.includes(src)) {
                        data.images.push(src);
                    }
                }
            });

            // If no images found, try alternative selectors
            if (data.images.length === 0) {
                const allImages = document.querySelectorAll('img[src*="takealot"]');
                allImages.forEach(img => {
                    const src = img.src;
                    if (src && src.includes('/product/') && !src.includes('placeholder')) {
                        data.images.push(src.replace(/pdpxs|pdps|pdpm/g, 'pdpxl'));
                    }
                });
            }

            // Category from breadcrumb
            const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a, [data-ref="breadcrumb"] a');
            if (breadcrumbs.length > 1) {
                data.category = breadcrumbs[breadcrumbs.length - 2]?.textContent.trim() || null;
            }

            return data;
        }, BASE_URL);

        return product;
    } catch (error) {
        console.error(`Error scraping product ${productUrl}:`, error.message);
        return null;
    }
}

/**
 * Get product links from a category/listing page
 */
async function getProductLinksFromPage() {
    return await page.evaluate((baseUrl) => {
        const links = [];
        const productCards = document.querySelectorAll('[data-ref="product-card"] a, [class*="product-card"] a, a[href*="/PLID"]');

        productCards.forEach(card => {
            const href = card.getAttribute('href');
            if (href && href.includes('/PLID')) {
                const fullUrl = href.startsWith('http') ? href : baseUrl + href;
                if (!links.includes(fullUrl)) {
                    links.push(fullUrl);
                }
            }
        });

        return links;
    }, BASE_URL);
}

/**
 * Check if there's a next page
 */
async function getNextPageUrl() {
    return await page.evaluate((baseUrl) => {
        const nextBtn = document.querySelector('[data-ref="pagination-forward"], [class*="pagination"] a[rel="next"], a[aria-label="Next page"]');
        if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('disabled')) {
            const href = nextBtn.getAttribute('href');
            return href ? (href.startsWith('http') ? href : baseUrl + href) : null;
        }
        return null;
    }, BASE_URL);
}

/**
 * Scrape a category
 */
async function scrapeCategory(categoryUrl, maxPages = 10) {
    const products = [];
    let currentUrl = categoryUrl;
    let pageNum = 1;

    try {
        while (currentUrl && pageNum <= maxPages) {
            console.error(`Scraping page ${pageNum}: ${currentUrl}`);

            await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            await randomDelay(1000, 2000);

            // Get product links on this page
            const productLinks = await getProductLinksFromPage();
            console.error(`Found ${productLinks.length} products on page ${pageNum}`);

            // Scrape each product
            for (const link of productLinks) {
                const product = await scrapeProduct(link);
                if (product && product.name && product.price) {
                    products.push(product);
                    console.error(`Scraped: ${product.name} - R${product.price}`);
                }
                await randomDelay(500, 1500);
            }

            // Check for next page
            await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            currentUrl = await getNextPageUrl();
            pageNum++;
        }
    } catch (error) {
        console.error(`Error scraping category:`, error.message);
    }

    return products;
}

/**
 * Get popular categories to scrape
 */
async function getCategories() {
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(1000, 2000);

        const categories = await page.evaluate((baseUrl) => {
            const cats = [];
            // Main navigation categories
            const navLinks = document.querySelectorAll('[data-ref="main-nav"] a, nav a[href*="/all/"]');
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const name = link.textContent.trim();
                if (href && name && href.includes('/all/')) {
                    cats.push({
                        name: name,
                        url: href.startsWith('http') ? href : baseUrl + href,
                    });
                }
            });
            return cats.slice(0, 20); // Limit to top 20 categories
        }, BASE_URL);

        return categories;
    } catch (error) {
        console.error(`Error getting categories:`, error.message);
        return [];
    }
}

/**
 * Scrape all products (main categories)
 */
async function scrapeAll(maxPagesPerCategory = 5) {
    const allProducts = [];

    // Default categories to scrape if we can't get them dynamically
    const defaultCategories = [
        { name: 'Electronics', url: `${BASE_URL}/electronics` },
        { name: 'Computers', url: `${BASE_URL}/computers` },
        { name: 'Gaming', url: `${BASE_URL}/gaming` },
        { name: 'Cell Phones', url: `${BASE_URL}/cellphones-wearables` },
        { name: 'Home & Kitchen', url: `${BASE_URL}/home-kitchen` },
        { name: 'Fashion', url: `${BASE_URL}/clothing-shoes-accessories` },
        { name: 'Health & Beauty', url: `${BASE_URL}/health-beauty` },
        { name: 'Sports', url: `${BASE_URL}/sports-outdoor` },
    ];

    let categories = await getCategories();
    if (categories.length === 0) {
        categories = defaultCategories;
    }

    console.error(`Scraping ${categories.length} categories...`);

    for (const category of categories) {
        console.error(`\nScraping category: ${category.name}`);
        const products = await scrapeCategory(category.url, maxPagesPerCategory);
        allProducts.push(...products);
        console.error(`Found ${products.length} products in ${category.name}`);
        await randomDelay(2000, 4000);
    }

    return allProducts;
}

/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);
    const action = args[0] || 'scrape_all';
    const paramsJson = args[1] || '{}';

    let params;
    try {
        params = JSON.parse(paramsJson);
    } catch (e) {
        params = {};
    }

    try {
        await initBrowser();

        let result;

        switch (action) {
            case 'scrape_product':
                if (params.url) {
                    result = await scrapeProduct(params.url);
                } else {
                    result = { error: 'Product URL is required' };
                }
                break;

            case 'scrape_category':
                if (params.url) {
                    result = await scrapeCategory(params.url, params.max_pages || 10);
                } else {
                    result = { error: 'Category URL is required' };
                }
                break;

            case 'scrape_all':
                result = await scrapeAll(params.max_pages_per_category || 5);
                break;

            case 'get_categories':
                result = await getCategories();
                break;

            default:
                result = { error: `Unknown action: ${action}` };
        }

        // Output result as JSON to stdout
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.log(JSON.stringify({ error: error.message }));
        process.exit(1);
    } finally {
        await closeBrowser();
    }
}

main();
