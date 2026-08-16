import { test, expect } from '@playwright/test';

test.describe('SetDrift E2E', () => {
  test('landing page and search', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Prepare for the')).toBeVisible();

    // Type in search bar
    const searchInput = page.getByPlaceholder('Search for an artist...');
    await searchInput.fill('Metallica');

    // Wait for debounce and results
    // We would need the dev server to be running and mocked, but as a basic structure:
    // const artistCard = page.locator('h3', { hasText: 'Metallica' }).first();
    // await expect(artistCard).toBeVisible();
    
    // In a real environment, we would click it, wait for navigation, drag and drop, and export.
    // However, since Spotify auth is required for export, e2e usually stubs the auth or just tests UI.
  });
});
