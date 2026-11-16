import { test, expect } from '@playwright/test';
import { loginAsFrontDesk } from './helpers/auth';

test.describe('07. TV Waiting Room Display Broadcast', () => {
  test('harus membatasi akses tamu langsung dan mengarahkan ke halaman login staf', async ({ page }) => {
    await page.goto('/tv');
    await page.waitForLoadState('networkidle');

    // Tamu yang belum login diarahkan ke login staf
    await expect(page).toHaveURL(/.*(staff|access-denied)/);
  });

  test('harus menampilkan layar antrean TV poliklinik setelah staf terotentikasi', async ({ page }) => {
    await loginAsFrontDesk(page);
    await page.goto('/tv');
    await page.waitForLoadState('networkidle');

    // Menampilkan identitas poliklinik pada layar TV
    await expect(page).toHaveURL(/.*tv/);
    await expect(page.getByText(/Klinik Pratama Sehat Utama|Poliklinik Umum/).first()).toBeVisible();

    // Jam digital ruang tunggu
    await expect(page.locator('[class*="font-mono"]').first()).toBeVisible();

    // Informasi antrean dan dokter
    await expect(page.getByText(/dr\. Budi Santoso|dr\. Siti Rahma|Antrean/).first()).toBeVisible();
  });
});
