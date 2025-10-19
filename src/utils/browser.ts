import { Page } from 'playwright';

/**
 * Intelligently finds and closes common cookie consent popups by trying a
 * list of common selectors and button texts.
 * @param page An active Playwright Page object.
 */
export async function handleCookiePopup(page: Page): Promise<void> {
  const selectors = [
    // Specific selector for common frameworks/apps like OWASP Juice Shop
    'button[aria-label="Close Welcome Banner"]',
    'button[aria-label="dismiss cookie message"]',
    // Generic selectors based on content and attributes
    '[id*="cookie"] button',
    '[class*="cookie"] button',
    page.getByRole('button', { name: /Accept|Agree|Got it|Dismiss|OK/i }),
  ];

  // Give the banner a moment to animate and appear
  await page.waitForTimeout(500);

  for (const selector of selectors) {
    // A try...catch block is inside the loop so that if one selector
    // fails, the function can still try the next one.
    try {
      const element = typeof selector === 'string' 
        ? page.locator(selector).first() 
        : selector;
      
      await element.waitFor({ state: 'visible', timeout: 1500 });
      await element.click({ timeout: 1000 });
      console.log('✅ Cookie popup handled.');
      
      // If the click is successful, we can exit the function.
      return; 
    } catch (error) {
      // This selector was not found, which is fine. The loop will continue.
    }
  }
}

/**
 * Checks for the presence of common CAPTCHA implementations on the page.
 * @param page An active Playwright Page object.
 * @returns True if a CAPTCHA is detected, false otherwise.
 */
export async function detectCaptcha(page: Page): Promise<boolean> {
  const captchaSelectors = [
    '.g-recaptcha',      // Google reCAPTCHA
    '.h-captcha',      // hCaptcha
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '#captcha',
  ];

  for (const selector of captchaSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 1000 })) {
        console.log(`[INFO] CAPTCHA detected with selector: ${selector}`);
        return true;
      }
    } catch (e) { 
      // Locator not found, which is expected. Continue to the next check.
    }
  }
  return false;
}