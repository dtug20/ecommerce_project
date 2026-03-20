const { test, expect } = require('@playwright/test');

test.describe('Blog Page', () => {
  test('loads blog listing page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveURL(/\/blog/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('blog page has proper title', async ({ page }) => {
    await page.goto('/blog');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
