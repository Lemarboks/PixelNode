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

test.describe('quote calculator', () => {
  test.skip(({ baseURL }) => !baseURL?.includes('127.0.0.1'), 'local build only');

  test('updates total and submits with quote summary', async ({ page }) => {
    let posted: Record<string, unknown> | null = null;
    await page.route('**/api/contact', async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/services.html', { waitUntil: 'domcontentloaded' });

    // Default base is "business" (R6 500) — total should show it.
    // (en-ZA formats thousands with a non-breaking space, so match digits loosely.)
    await expect(page.locator('[data-total]')).toContainText(/R6.?500/);

    // Add hosting add-on → total increases to R7 700.
    // Inputs are visually hidden behind styled labels, so click the label.
    await page.locator('[data-addons] input[value="hosting"]').locator('..').click();
    await expect(page.locator('[data-total]')).toContainText(/R7.?700/);

    // Pick a care plan → monthly appears.
    await page.locator('[data-care] input[value="lite"]').locator('..').click();
    await expect(page.locator('[data-total]')).toContainText(/R350/);

    // Submit.
    await page.fill('[data-quote-form] input[name="name"]', 'Quote Tester');
    await page.fill('[data-quote-form] input[name="email"]', 'quote@example.com');
    await page.click('[data-quote-form] button[type="submit"]');

    await expect(page.locator('[data-quote-status]')).toHaveAttribute('data-state', 'success');
    expect(posted).toMatchObject({ name: 'Quote Tester', email: 'quote@example.com' });
    expect(String((posted as Record<string, unknown>).quoteSummary)).toContain('Business website');
  });
});
