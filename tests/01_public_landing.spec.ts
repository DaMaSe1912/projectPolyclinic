import { test, expect } from '@playwright/test';

test.describe('01. Public Landing Page & Navigation', () => {
  test('harus memuat halaman utama dengan identitas klinik dan navigasi', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Cek judul halaman dan identitas klinik
    await expect(page).toHaveTitle(/Klinik Pratama Sehat Utama/);
    await expect(page.locator('text=Klinik Pratama Sehat Utama').first()).toBeVisible();
    await expect(page.locator('text=Poliklinik Umum').first()).toBeVisible();

    // Cek menu navigasi
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Beranda & Jadwal').first()).toBeVisible();
  });

  test('harus dapat bernavigasi ke portal pasien dari landing page', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Klik tombol portal pasien di hero section atau navbar
    const patientBtn = page.getByRole('link', { name: /masuk/i }).first();
    await patientBtn.click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Portal Pasien').first()).toBeVisible();
  });

  test('harus dapat bernavigasi ke portal staf dari landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const staffLink = page.locator('a[href="/staff"]').first();
    if (await staffLink.isVisible()) {
      await staffLink.click();
      await expect(page).toHaveURL(/.*staff/);
    }
  });
});
