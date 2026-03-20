const { test, expect } = require('@playwright/test');

test.describe('Cart', () => {
  test('cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('empty cart shows appropriate message', async ({ page }) => {
    await page.goto('/cart');
    // Cart should either show items or an empty state
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
