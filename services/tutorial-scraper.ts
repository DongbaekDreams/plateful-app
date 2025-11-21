import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extract image URL from HTML using multiple strategies
 */
function extractImageUrl($: cheerio.CheerioAPI, url: string): string | null {
  // Strategy 1: Check Open Graph image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return ogImage.startsWith('http') ? ogImage : new URL(ogImage, url).href;
  }

  // Strategy 2: Check Twitter card image
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    return twitterImage.startsWith('http') ? twitterImage : new URL(twitterImage, url).href;
  }

  // Strategy 3: Find main article image by common selectors
  const imageSelectors = [
    'article img:first',
    '.article img:first',
    '.tutorial img:first',
    '.guide img:first',
    '.post-content img:first',
    '.entry-content img:first',
    'main img:first',
    '.content img:first',
    '.post img:first',
    '.recipe img:first',
    '[class*="featured"] img:first',
    '[class*="hero"] img:first',
    'img[class*="featured"]:first',
    'img[class*="hero"]:first',
  ];

  for (const selector of imageSelectors) {
    const img = $(selector).first();
    if (img.length > 0) {
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('data-original');
      if (src) {
        // Filter out small images (likely icons) and logos
        const width = parseInt(img.attr('width') || '0');
        const height = parseInt(img.attr('height') || '0');
        const isLargeEnough = width > 200 || height > 200 || (!width && !height);
        
        if (isLargeEnough && 
            !src.includes('logo') && 
            !src.includes('avatar') && 
            !src.includes('icon') &&
            !src.includes('favicon')) {
          const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
          console.log(`Found image via selector "${selector}": ${fullUrl}`);
          return fullUrl;
        }
      }
    }
  }

  // Strategy 4: Get first large image from article/main content area
  const contentArea = $('article, main, [role="article"], .article, .post, .content').first();
  if (contentArea.length > 0) {
    const images = contentArea.find('img');
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const img = $(images[i]);
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
      if (src && 
          !src.includes('logo') && 
          !src.includes('avatar') && 
          !src.includes('icon') &&
          !src.includes('favicon')) {
        const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
        console.log(`Found image in content area: ${fullUrl}`);
        return fullUrl;
      }
    }
  }

  return null;
}

/**
 * Extract author name from HTML
 */
function extractAuthor($: cheerio.CheerioAPI): string | null {
  // Try various author selectors
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.author',
    '.byline',
    '[rel="author"]',
    '.article-author',
  ];

  for (const selector of authorSelectors) {
    const author = $(selector).first();
    if (author.length > 0) {
      const text = author.attr('content') || author.text().trim();
      if (text) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Extract site name from HTML
 */
function extractSiteName($: cheerio.CheerioAPI, url: string): string | null {
  // Try Open Graph site name
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName) {
    return ogSiteName;
  }

  // Extract from domain
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '').split('.')[0];
  } catch {
    return null;
  }
}

/**
 * Scrape tutorial content and metadata from a URL
 */
export interface ScrapedTutorial {
  content: string;
  imageUrl: string | null;
  author: string | null;
  siteName: string | null;
}

/**
 * Scrape tutorial content from a URL
 */
export async function scrapeTutorialContent(url: string): Promise<ScrapedTutorial> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Scraping tutorial from: ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500
      });
      
      if (response.status === 403) {
        throw new Error(`Access forbidden (403) - website blocking scraper`);
      }
      
      if (response.status === 404) {
        throw new Error(`Tutorial page not found (404)`);
      }
      
      if (response.status >= 500) {
        throw new Error(`Server error (${response.status})`);
      }
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    
      const $ = cheerio.load(response.data);
      
      // Extract metadata
      const imageUrl = extractImageUrl($, url);
      const author = extractAuthor($);
      const siteName = extractSiteName($, url);
      
      if (imageUrl) {
        console.log(`✅ Extracted image: ${imageUrl}`);
      } else {
        console.warn(`⚠️ No image found for: ${url}`);
      }
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, .advertisement, .ads, .ad, .sidebar, .comments, .social-share, .related, .newsletter, noscript').remove();
      
      let content = '';
      
      // Try to find tutorial/article content using common selectors
      const contentSelectors = [
        'article',
        '.article',
        '.tutorial',
        '.guide',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.content-wrapper',
        'main[class*="article"]',
        'main[class*="tutorial"]',
        'main',
        '.main-content',
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          // First try to extract structured content with headings
          const clone = element.clone();
          // Convert headings to text with markers
          clone.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
            const headingText = $(el).text().trim();
            $(el).replaceWith(`\n\n## ${headingText}\n\n`);
          });
          // Convert lists to text
          clone.find('ul, ol').each((_, el) => {
            const listText = $(el).find('li').map((_, li) => `- ${$(li).text().trim()}`).get().join('\n');
            $(el).replaceWith(`\n${listText}\n`);
          });
          // Extract the text with preserved structure
          const text = clone.text().trim();
          if (text.length > 300) {
            content = text;
            console.log(`Found tutorial content using selector: ${selector}`);
            break;
          }
        }
      }
      
      // Fallback to body content
      if (!content || content.length < 200) {
        content = $('body').text().trim();
        console.log(`Using full body content as fallback`);
      }
      
      // Clean up the content while preserving paragraph structure
      // First, normalize whitespace but keep paragraph breaks
      content = content
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ') // Collapse multiple spaces/tabs to single space
        .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to double newline
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0) // Remove empty lines
        .join('\n\n') // Join with double newlines for paragraph breaks
        .replace(/\n\n+/g, '\n\n') // Ensure no more than double newlines
        .trim();
      
      console.log(`✅ Scraped ${content.length} characters from ${url}`);
      
      if (content.length < 100) {
        throw new Error('Scraped content is too short, likely failed to extract tutorial');
      }
      
      return {
        content,
        imageUrl,
        author,
        siteName,
      };
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          lastError = new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
        } else if (error.request) {
          lastError = new Error(`Network error: No response from server`);
        } else {
          lastError = new Error(`Request error: ${error.message}`);
        }
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
      
      console.error(`❌ Error scraping ${url} (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to scrape tutorial from ${url} after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

