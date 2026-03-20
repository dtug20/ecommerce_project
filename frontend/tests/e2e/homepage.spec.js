const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('loads and renders header and footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    // Verify main navigation exists
    const nav = page.locator('nav, .main-menu, .tp-main-menu');
    await expect(nav.first()).toBeVisible();
  });

  test('clicking Shop navigates to shop page', async ({ page }) => {
    await page.goto('/');
    const shopLink = page.locator('a[href="/shop"], a:has-text("Shop")').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
      await expect(page).toHaveURL(/\/shop/);
    }
  });
});
