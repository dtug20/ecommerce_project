// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Currency switcher', () => {
  test('anonymous user can switch VND ↔ USD via Clicon welcome bar; persists across reload', async ({ page }) => {
    await page.goto('/');

    // Wait for the welcome-bar currency toggle to mount.
    // The currency dropdown toggle shows just the 3-letter currency code (e.g. "VND", "USD").
    // The language toggle shows the full language name ("English" / "Tiếng Việt"), so we
    // distinguish by matching exactly a 3-letter uppercase code.
    const currencyToggle = page
      .locator('.cl-welcome-bar__dropdown-toggle')
      .filter({ hasText: /^(VND|USD|EUR|GBP|JPY)$/ })
      .first();

    await expect(currencyToggle).toBeVisible({ timeout: 10000 });

    // Read initial state (could be VND by default or whatever is in the cookie).
    const initialText = (await currencyToggle.innerText()).trim();

    // Open the dropdown.
    await currencyToggle.click();

    // Pick USD if currently not USD; otherwise pick VND.
    // Currency menu items have labels like "Dollar (USD)", "Đồng (VND)", "Euro (EUR)".
    const targetCode = initialText.includes('USD') ? 'VND' : 'USD';
    await page
      .locator('.cl-welcome-bar__dropdown-menu .cl-welcome-bar__dropdown-item')
      .filter({ hasText: new RegExp(`\\(${targetCode}\\)`) })
      .first()
      .click();

    // The toggle should now display the target code.
    await expect(currencyToggle).toContainText(targetCode, { timeout: 5000 });

    // Reload — Redux state is persisted via cookie/localStorage so the choice is restored.
    await page.reload();

    const toggleAfterReload = page
      .locator('.cl-welcome-bar__dropdown-toggle')
      .filter({ hasText: /^(VND|USD|EUR|GBP|JPY)$/ })
      .first();
    await expect(toggleAfterReload).toContainText(targetCode, { timeout: 10000 });
  });

  test('switcher exposes all 5 currencies', async ({ page }) => {
    await page.goto('/');

    const currencyToggle = page
      .locator('.cl-welcome-bar__dropdown-toggle')
      .filter({ hasText: /^(VND|USD|EUR|GBP|JPY)$/ })
      .first();
    await expect(currencyToggle).toBeVisible({ timeout: 10000 });
    await currencyToggle.click();

    // The currency dropdown menu is the one that appeared (last visible one, or we locate by
    // the parent container that contains the currency toggle we just clicked).
    const currencyMenu = page
      .locator('.cl-welcome-bar__dropdown')
      .filter({ has: currencyToggle })
      .locator('.cl-welcome-bar__dropdown-menu');

    await expect(currencyMenu).toBeVisible();
    for (const code of ['VND', 'USD', 'EUR', 'GBP', 'JPY']) {
      await expect(
        currencyMenu
          .locator('.cl-welcome-bar__dropdown-item')
          .filter({ hasText: new RegExp(`\\(${code}\\)`) })
      ).toHaveCount(1);
    }
  });
});
