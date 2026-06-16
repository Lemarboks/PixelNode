import { expect, test } from '@playwright/test';
test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local only');
test('about content reveals on scroll', async ({ page }) => {
  await page.goto('/about.html', { waitUntil: 'networkidle' });
  const h1 = page.locator('#about-title');
  await expect(h1).toBeVisible();
  await expect(h1).toHaveText(/digital studio/i);
  // Primary hud (top) reveals immediately.
  await expect(page.locator('.about-hud-primary')).toHaveClass(/visible/);
  // Scroll the signal block into view → it should reveal.
  await page.locator('.about-signal').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.about-signal').first()).toHaveClass(/visible/);
  // And it should actually be visible (opacity 1).
  await expect(page.locator('.about-signal').first()).toBeVisible();
});
