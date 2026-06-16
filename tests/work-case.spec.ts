import { expect, test } from '@playwright/test';
test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local only');
test('case studies render and reveal', async ({ page }) => {
  await page.goto('/work.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#case-title')).toContainText(/came together/i);
  const studies = page.locator('.case-study');
  await expect(studies).toHaveCount(3);
  // Scroll the first into view → it reveals.
  await studies.first().scrollIntoViewIfNeeded();
  await expect(studies.first()).toHaveClass(/visible/);
  await expect(studies.first()).toContainText('Bloubergrant High School');
  await expect(studies.first()).toContainText('The challenge');
});
