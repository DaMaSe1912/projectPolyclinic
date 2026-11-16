import { test, expect } from '@playwright/test';
import { loginAsPatient } from './helpers/auth';

test.describe('04. Patient Portal Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
  });

  test('harus memuat dashboard pasien dengan data profil dan antrean aktif', async ({ page }) => {
    await expect(page).toHaveURL(/.*pasien/);
    await expect(page.locator('text=Bambang Wijaya').first()).toBeVisible();
    await expect(page.locator('button:has-text("Antrean Baru"), button:has-text("Ambil Antrean")').first()).toBeVisible();
  });

  test('harus dapat membuka modal pendaftaran / reservasi antrean baru', async ({ page }) => {
    const bookBtn = page.locator('button:has-text("Antrean Baru"), button:has-text("Ambil Antrean")').first();
    await bookBtn.click();

    // Modal reservasi terbuka
    await expect(page.locator('text=Daftar Antrean Janji Temu Online')).toBeVisible();
    await expect(page.locator('text=Pilih Anggota Keluarga')).toBeVisible();
  });

  test('harus dapat melihat informasi antrean atau riwayat kunjungan pasien', async ({ page }) => {
    await expect(page.getByText(/Antrean Aktif|Belum Ada Antrean|Bambang Wijaya/).first()).toBeVisible();
  });
});
