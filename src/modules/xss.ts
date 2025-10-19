import { Page, Locator } from 'playwright';
import { AttackResult } from '../core/types';
import { handleCookiePopup } from '../utils/browser';

const XSS_SUCCESS_FLAG = 'xploitron-xss-flag-a9b8c7';

export async function runXSSAttack(page: Page, url: string, inputLocator: Locator, payload: string): Promise<AttackResult> {
  const selectorName = (await inputLocator.getAttribute('name')) || (await inputLocator.getAttribute('id')) || `[aria-label="${await inputLocator.getAttribute('aria-label')}"]` || 'input';
  
  try {
    let vulnerabilityFound = false;
    const effectivePayload = payload.replace(/alert\((.*?)\)/g, `alert('${XSS_SUCCESS_FLAG}')`);

    const dialogPromise = new Promise<void>(resolve => {
      page.once('dialog', async dialog => {
        if (dialog.message() === XSS_SUCCESS_FLAG) vulnerabilityFound = true;
        await dialog.dismiss();
        resolve();
      });
    });
    
    // The scanner navigates, we just handle popups and attack
    await handleCookiePopup(page);
    await inputLocator.fill(effectivePayload);
    await page.keyboard.press('Enter');

    await Promise.race([dialogPromise, page.waitForTimeout(1500)]);
    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Go back for the next test

    return {
      attackType: 'XSS',
      url,
      selector: selectorName,
      payload,
      status: vulnerabilityFound ? 'Vulnerable ⚠️' : 'Secure ✅',
    };
  } catch (error) {
    return {
      attackType: 'XSS',
      url,
      selector: selectorName,
      payload,
      status: 'Error ❌',
    };
  }
}