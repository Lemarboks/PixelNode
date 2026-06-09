import { expect, test } from '@playwright/test';

test('homepage loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  const response = await page.goto('/PixelNode/', { waitUntil: 'domcontentloaded' });

  expect(response, 'homepage returned a response').not.toBeNull();
  expect(response!.status(), 'homepage HTTP status').toBeGreaterThanOrEqual(200);
  expect(response!.status(), 'homepage HTTP status').toBeLessThan(400);
  await expect(page).toHaveTitle(/PixelNode/i);
  await expect(page.locator('body')).toBeVisible();
  expect(errors, 'JavaScript console/page errors').toEqual([]);
});
