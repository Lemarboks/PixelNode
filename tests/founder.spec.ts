import { expect, test } from '@playwright/test';
test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local only');
test('founder page renders all sections', async ({ page }) => {
  await page.goto('/founder.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#founder-h1')).toContainText(/drive growth/i);
  // Person structured data is present.
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ld).toContain('"Person"');
  expect(ld).toContain('Lemar Boks');
  // Sections render.
  await expect(page.locator('.expertise-card')).toHaveCount(6);
  // Featured-projects section removed; ensure it's gone.
  await expect(page.locator('.founder-project')).toHaveCount(0);
  await expect(page.locator('.timeline-item')).toHaveCount(4);
  await expect(page.locator('.connect-link')).toHaveCount(4);
  // A reveal element shows on scroll.
  await page.locator('.expertise-card').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.expertise-card').first()).toHaveClass(/visible/);
});
