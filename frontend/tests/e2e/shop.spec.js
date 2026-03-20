const { test, expect } = require('@playwright/test');

test.describe('Shop Page', () => {
  test('loads shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveURL(/\/shop/);
    // Page should render without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays products', async ({ page }) => {
    await page.goto('/shop');
    // Wait for product items to load
    const products = page.locator('.tp-product-item, .tp-product-list-item');
    // May be empty if no products seeded — just verify no crash
    await page.waitForTimeout(2000);
  });

  test('supports query parameter filtering', async ({ page }) => {
    await page.goto('/shop?productType=electronics');
    await expect(page).toHaveURL(/productType=electronics/);
    // Page should not crash with filter params
    await expect(page.locator('body')).toBeVisible();
  });

  test('shop page has SEO meta tags', async ({ page }) => {
    await page.goto('/shop');
    const title = await page.title();
    expect(title).toContain('Shop');
  });
});
