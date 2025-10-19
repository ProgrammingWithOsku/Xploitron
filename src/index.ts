import { chromium, Page, Browser, BrowserContext } from 'playwright';
import { generateSecureReport } from './core/engine';
import { queryLocalLLM } from './core/llama';
import { xssPrompt } from './payloads/xss.prompt';
import { TARGET_URL, SCAN_MODE } from './core/config';
import { ReportData } from './core/types';
import { crawlSite } from './utils/crawler';
import { runScans } from './core/scanner';

async function main() {
  const browser: Browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({
    bypassCSP: true,
  });
  const page: Page = await context.newPage();

  // --- REMOVE THIS ENTIRE BLOCK ---
  // await page.route('**/*', (route) => {
  //   const resourceType = route.request().resourceType();
  //   if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
  //     route.abort();
  //   } else {
  //     route.continue();
  //   }
  // });
  // --- END OF BLOCK TO REMOVE ---

  try {
    // 1. Get Payloads from the LLM
    console.log('🤖 Querying LLM for attack payloads...');
    const llmResponse = await queryLocalLLM(xssPrompt);
    let payloads: string[] = [];
    try {
      payloads = JSON.parse(llmResponse);
    } catch {
      payloads = [llmResponse];
    }

    // 2. Discover URLs to Scan
    let urlsToScan: string[];
    if (SCAN_MODE === 'recursive') {
      urlsToScan = await crawlSite(page, TARGET_URL);
    } else {
      urlsToScan = [TARGET_URL];
    }

    // 3. Run All Scans
    const scanResults = await runScans(page, urlsToScan, payloads);
    console.log(`✅ All scans complete. Generated ${scanResults.length} results.`);

    // 4. Generate the Final Report
    const reportData: ReportData = {
      target: TARGET_URL,
      results: scanResults,
      llmResponse,
    };
    generateSecureReport(reportData);

  } catch (error) {
    console.error("An unexpected error occurred:", error);
  } finally {
    await browser.close();
  }
}

main();