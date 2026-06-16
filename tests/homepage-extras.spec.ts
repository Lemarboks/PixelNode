import { expect, test } from '@playwright/test';
test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local only');

test('homepage shows status widget and testimonials', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  // Status widget
  await expect(page.locator('.status-card')).toHaveCount(4);
  await expect(page.locator('[data-stat="uptime"]')).toContainText('99.9%');
  // Testimonials reveal on scroll
  const testi = page.locator('.testimonial');
  await expect(testi).toHaveCount(3);
  await testi.first().scrollIntoViewIfNeeded();
  await expect(testi.first()).toHaveClass(/visible/);
});

test('services page shows FAQ that expands', async ({ page }) => {
  await page.goto('/services.html', { waitUntil: 'networkidle' });
  const items = page.locator('.faq-item');
  await expect(items).toHaveCount(6);
  // Open the first FAQ → its answer becomes visible.
  await items.first().locator('summary').click();
  await expect(items.first().locator('p')).toBeVisible();
  await expect(items.first().locator('p')).toContainText(/1.?2 weeks/i);
});
