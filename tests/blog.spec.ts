import { expect, test } from '@playwright/test';
test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local only');

test('blog index lists articles', async ({ page }) => {
  await page.goto('/blog.html', { waitUntil: 'networkidle' });
  await expect(page.locator('.blog-card')).toHaveCount(4);
  await page.locator('.blog-card').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.blog-card').first()).toHaveClass(/visible/);
});

test('article page has content and Article schema by Lemar Boks', async ({ page }) => {
  await page.goto('/blog-website-cost-cape-town.html', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText(/cost in Cape Town/i);
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ld).toContain('"Article"');
  expect(ld).toContain('Lemar Boks');
  // Internal link to the quote calculator exists.
  await expect(page.locator('a[href*="services.html#quote"]').first()).toBeVisible();
});
