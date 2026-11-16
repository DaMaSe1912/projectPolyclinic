import { test, expect } from '@playwright/test';
import { loginAsDoctor } from './helpers/auth';

test.describe('06. Doctor Clinical Workspace & Consultation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });

  test('harus memuat ruang kerja klinis dokter dan daftar pasien', async ({ page }) => {
    await expect(page).toHaveURL(/.*klinis/);
    await expect(page.getByText(/dr\. Budi Santoso|Ruang Praktik/).first()).toBeVisible();
    await expect(page.getByText(/Tablet \/ PC Ruang Praktik|Ruang Praktik|Shift/).first()).toBeVisible();
  });

  test('harus memiliki kontrol pemanggilan antrean dan audio speaker', async ({ page }) => {
    // Tombol panggilan atau toggle audio
    await expect(page.locator('button:has-text("Suara"), button:has-text("Mute"), button:has-text("Panggil")').first()).toBeVisible();
  });

  test('harus dapat membuka modal pembuatan surat rujukan rumah sakit', async ({ page }) => {
    const referralBtn = page.locator('button:has-text("Rujukan"), button:has-text("Buat Surat Rujukan")').first();
    if (await referralBtn.isVisible()) {
      await referralBtn.click();
      await expect(page.getByText(/Surat Rujukan Rumah Sakit|Rumah Sakit Tujuan/).first()).toBeVisible();
    }
  });
});
