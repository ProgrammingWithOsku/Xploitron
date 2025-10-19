import { Page } from 'playwright';
import { AttackResult } from './types';
import { runXSSAttack } from '../modules/xss';
import { detectCaptcha } from '../utils/browser';

const DYNAMIC_INPUT_SELECTOR = 'input[type="text"], input[type="search"], input[type="email"], input[type="password"], textarea';

export async function runScans(page: Page, urls: string[], payloads: string[]): Promise<AttackResult[]> {
  const allResults: AttackResult[] = [];
  console.log(`🚀 Starting dynamic scans on ${urls.length} pages...`);

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 7000 });

      if (await detectCaptcha(page)) {
        console.warn(`⚠️ CAPTCHA detected on ${url}. Skipping scans on this page.`);
        continue;
      }

      const inputs = await page.locator(DYNAMIC_INPUT_SELECTOR).all();

      if (inputs.length === 0) {
        console.log(`[INFO] No inputs found on ${url}. Skipping.`);
        continue;
      }

      console.log(`[INFO] Found ${inputs.length} input fields to test on: ${url}`);
      
      const pageScanPromises: Promise<AttackResult>[] = [];
      for (const inputLocator of inputs) {
        for (const payload of payloads) {
          pageScanPromises.push(runXSSAttack(page, url, inputLocator, payload));
        }
      }
      const pageResults = await Promise.all(pageScanPromises);
      allResults.push(...pageResults);

    } catch (error) {
      console.warn(`⚠️  Failed to scan page ${url}. Error: ${(error as Error).message}`);
    }
  }
  return allResults;
}