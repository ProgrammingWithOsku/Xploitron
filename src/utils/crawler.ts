import { Page } from 'playwright';
import { handleCookiePopup } from './browser';

async function discoverLinksOnPage(page: Page, url: string): Promise<string[]> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await handleCookiePopup(page);
    return await page.$$eval('a', (anchors: HTMLAnchorElement[]) => anchors.map(anchor => anchor.href));
  } catch (error) {
    console.warn(`⚠️  Could not crawl ${url}. Error: ${(error as Error).message}`);
    return [];
  }
}

export async function crawlSite(page: Page, startUrl: string): Promise<string[]> {
  const urlsToVisit: string[] = [startUrl];
  const visitedUrls = new Set<string>();
  const targetOrigin = new URL(startUrl).origin;
  console.log(`[SCOPE] Scanning will be limited to origin: ${targetOrigin}`);

  let currentIndex = 0;
  while (currentIndex < urlsToVisit.length) {
    const currentUrl = urlsToVisit[currentIndex];
    currentIndex++;
    if (visitedUrls.has(currentUrl)) continue;
    visitedUrls.add(currentUrl);
    console.log(`[CRAWLING] Exploring: ${currentUrl}`);

    const foundLinks = await discoverLinksOnPage(page, currentUrl);
    for (const link of foundLinks) {
      if (link.includes('redirect?to=http')) continue;
      try {
        const absoluteUrl = new URL(link, currentUrl).href;
        if (absoluteUrl.startsWith(targetOrigin) && !visitedUrls.has(absoluteUrl)) {
          urlsToVisit.push(absoluteUrl);
        }
      } catch (error) { /* Ignore invalid URLs */ }
    }
  }
  return Array.from(visitedUrls);
}