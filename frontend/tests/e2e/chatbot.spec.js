const { test, expect } = require('@playwright/test');

test.describe('Chatbot widget', () => {
  test('bubble is visible on home and panel opens with welcome', async ({ page }) => {
    await page.goto('/');
    const bubble = page.locator('.shofy-chat__bubble');
    await expect(bubble).toBeVisible({ timeout: 10_000 });

    await bubble.click();
    await expect(page.locator('.shofy-chat__panel')).toBeVisible();
    await expect(
      page.locator('.shofy-chat__msg--assistant').first()
    ).toContainText(/help|giúp/i);
  });

  test('sends a message and receives a response', async ({ page }) => {
    await page.goto('/');
    await page.locator('.shofy-chat__bubble').click();

    const input = page.locator('.shofy-chat__input textarea');
    await input.fill('Hi');
    await page.locator('.shofy-chat__input button').click();

    await expect(page.locator('.shofy-chat__msg--user').last()).toContainText('Hi');

    // Wait for an assistant turn to appear. Index 1 because index 0 is the
    // welcome message. Long timeout because the agent may run tool calls.
    await expect(page.locator('.shofy-chat__msg--assistant').nth(1)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('close button hides the panel and shows the bubble again', async ({ page }) => {
    await page.goto('/');
    await page.locator('.shofy-chat__bubble').click();
    await expect(page.locator('.shofy-chat__panel')).toBeVisible();

    await page.locator('button[aria-label="Close chat"], button[aria-label="Đóng trò chuyện"]').click();
    await expect(page.locator('.shofy-chat__panel')).toBeHidden();
    await expect(page.locator('.shofy-chat__bubble')).toBeVisible();
  });
});
