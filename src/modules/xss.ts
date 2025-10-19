import { chromium } from 'playwright';
import { ScanResult } from '../core/types.js';
import path from 'path';
import fs from 'fs';

export async function runXSSScan(target: string, payload: string): Promise<ScanResult> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const visitedPages = new Set<string>();
  const triedSelectors: string[] = [];
  let xssDetected = false;

  const baseURL = new URL(target).origin;

  // إنشاء مجلد خاص بالـ payload داخل results/screens
  const safePayloadFolder = payload.replace(/[^a-z0-9_\-]/gi, '_').slice(0, 40);
  const screenshotDir = path.join('results', 'screens', safePayloadFolder);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // تحميل الصفحة الرئيسية
  await page.goto(target, { waitUntil: 'domcontentloaded' });

  // إغلاق نافذة الكوكيز إن وجدت
  try {
    const cookieSelectors = [
      'button:text("Accept")',
      'button:text("Agree")',
      'button:text("Got it")',
      'button:text("Allow")',
      'button:text("OK")',
      '[id*="cookie"] button',
      '[class*="cookie"] button',
      '[aria-label*="cookie"]',
      '[role="dialog"] button'
    ];

    for (const selector of cookieSelectors) {
      const found = await page.$(selector);
      if (found) {
        await found.click();
        console.log(`✅ Cookie popup closed using selector: ${selector}`);
        break;
      }
    }
  } catch {
    console.warn('⚠️ Failed to close cookie popup');
  }

  // استخراج روابط SPA الداخلية مثل #/login
  const spaLinks = await page.$$eval('a[href^="#/"]', anchors =>
    anchors
      .map(a => (a as HTMLAnchorElement).getAttribute('href'))
      .filter((href): href is string => href !== null)
  );

  const uniqueSpaLinks = [...new Set(spaLinks)].filter(Boolean);

  // فحص الصفحة الرئيسية أولًا
  await scanCurrentPage(`${baseURL}/`);

  // ثم التنقل إلى كل رابط SPA داخلي
  for (const hash of uniqueSpaLinks) {
    const fullUrl = `${baseURL}/${hash}`;
    if (visitedPages.has(fullUrl)) continue;

    try {
      await page.evaluate(h => {
        window.location.hash = h;
      }, hash);
      await page.waitForTimeout(1500);
      await scanCurrentPage(fullUrl);
    } catch {
      console.warn(`⚠️ Failed to navigate to ${hash}`);
    }
  }

  await browser.close();

  return {
    xssDetected,
    triedSelectors
  };

  // دالة فحص الصفحة الحالية
  async function scanCurrentPage(url: string) {
    if (visitedPages.has(url)) return;
    visitedPages.add(url);

    const selectors = await page.$$eval('*', elements =>
      elements
        .filter(el =>
          el.matches('input, textarea, select, [contenteditable="true"]')
        )
        .map(el => {
          const name = el.getAttribute('name');
          const id = el.getAttribute('id');
          const type = el.getAttribute('type');
          const tag = el.tagName.toLowerCase();

          if (name) return `${tag}[name="${name}"]`;
          if (id) return `${tag}#${id}`;
          if (type && tag === 'input') return `input[type="${type}"]`;
          return tag;
        })
    );

    const uniqueSelectors = [...new Set(selectors)];
    if (uniqueSelectors.length === 0) return;

    for (const selector of uniqueSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        await page.fill(selector, payload).catch(() => {
          page.$eval(selector, (el, val) => (el.innerHTML = val), payload);
        });

        const safeSelector = selector.replace(/[^a-z0-9_\-]/gi, '_').slice(0, 50);
        const screenshotPath = path.join(screenshotDir, `xss_${Date.now()}_${safeSelector}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        triedSelectors.push(`[${url}] → ${selector}`);
      } catch {
        console.warn(`⚠️ Failed to inject into ${selector} on ${url}`);
      }
    }

    const found = await page.evaluate(() => {
      return document.body.innerHTML.includes('alert(');
    });

    if (found) xssDetected = true;
  }
}