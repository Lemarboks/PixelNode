import { expect, test } from '@playwright/test';

/**
 * Contact form behaviour tests. These run against the locally-served build
 * (see the `local` project in playwright.config.ts) and mock /api/contact so
 * they exercise the frontend wiring without touching Supabase or Resend.
 */
test.describe('contact form', () => {
  test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local build only');

  test('posts JSON to /api/contact and shows success', async ({ page }) => {
    let postedBody: Record<string, unknown> | null = null;

    await page.route('**/api/contact', async (route) => {
      postedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });

    await page.goto('/contact.html', { waitUntil: 'domcontentloaded' });

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="project"]', { label: 'New website' });
    await page.fill('textarea[name="message"]', 'Please build me a site.');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'success');
    expect(postedBody).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      project: 'New website',
      message: 'Please build me a site.'
    });
  });

  test('shows error message when the API rejects', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'A valid email is required' })
      });
    });

    await page.goto('/contact.html', { waitUntil: 'domcontentloaded' });

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="project"]', { label: 'New website' });
    await page.fill('textarea[name="message"]', 'Hello');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('[data-form-status]')).toContainText('valid email');
  });
});
