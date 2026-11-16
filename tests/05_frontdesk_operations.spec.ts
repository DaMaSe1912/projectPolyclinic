import { test, expect } from '@playwright/test';
import { loginAsFrontDesk } from './helpers/auth';

test.describe('05. Front Desk Operations & Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('harus memuat dashboard resepsionis dengan tabel antrean dan tombol aksi', async ({ page }) => {
    await expect(page).toHaveURL(/.*petugas/);
    await expect(page.getByText(/Resepsionis|Dewi Lestari/).first()).toBeVisible();
    await expect(page.locator('button:has-text("Walk-in"), button:has-text("Pendaftaran")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Triase"), button:has-text("Darurat")').first()).toBeVisible();
  });

  test('harus dapat membuka modal pendaftaran pasien Walk-in', async ({ page }) => {
    const walkinBtn = page.locator('button:has-text("Walk-in")').first();
    await walkinBtn.click();

    // Modal walk-in muncul
    await expect(page.getByText('Pendaftaran Pasien Walk-in').first()).toBeVisible();
  });

  test('harus dapat membuka modal Triase Darurat', async ({ page }) => {
    const emergencyBtn = page.locator('button:has-text("Triase"), button:has-text("Darurat")').first();
    await emergencyBtn.click();

    // Modal triase darurat muncul
    await expect(page.getByText('Triase Cepat & Pasien Darurat')).toBeVisible();
    await expect(page.getByText('Tingkat Triase Klinis')).toBeVisible();
  });

  test('harus memiliki filter pencarian antrean pasien', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Cari"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Bambang');
  });
});
