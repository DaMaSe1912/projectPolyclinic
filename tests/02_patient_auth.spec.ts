import { test, expect } from '@playwright/test';

test.describe('02. Patient Authentication & Security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('harus menampilkan tab Masuk, Daftar Baru, dan Lupa Password', async ({ page }) => {
    await expect(page.locator('button:has-text("Masuk Akun")')).toBeVisible();
    await expect(page.locator('button:has-text("Daftar Baru")')).toBeVisible();
    await expect(page.locator('button:has-text("Lupa Password")')).toBeVisible();
  });

  test('harus menampilkan error saat login dengan kredensial yang salah', async ({ page }) => {
    await page.fill('input[type="email"]', 'salah@email.com');
    await page.fill('input[placeholder="••••••••"]', 'Passwordsalah123!');
    await page.click('button[type="submit"]:has-text("Masuk ke Antrean Saya")');

    // Menampilkan pesan error
    await expect(page.locator('text=Email atau password salah')).toBeVisible();
  });

  test('harus berhasil masuk dengan akun pasien yang valid', async ({ page }) => {
    await page.fill('input[type="email"]', 'bambang.wijaya@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'PasienBambang123');
    await page.click('button[type="submit"]:has-text("Masuk ke Antrean Saya")');

    await page.waitForURL('**/pasien', { timeout: 10000 });
    await expect(page.locator('text=Bambang Wijaya').first()).toBeVisible();
  });

  test('harus memvalidasi kecocokan konfirmasi password pada tab pendaftaran', async ({ page }) => {
    await page.click('button:has-text("Daftar Baru")');
    await expect(page.locator('label:has-text("Nama Lengkap Pasien")')).toBeVisible();

    // Isi password tidak cocok
    await page.locator('input[placeholder="Minimal 8 karakter..."]').fill('PasswordRahasia123');
    await page.locator('input[placeholder="Ulangi kata sandi..."]').fill('PasswordBerbeda123');

    await expect(page.locator('text=Konfirmasi kata sandi belum cocok')).toBeVisible();
  });

  test('harus dapat beralih ke tab Lupa Password dan mengirimkan permintaan reset', async ({ page }) => {
    await page.click('button:has-text("Lupa Password")');
    await expect(page.locator('h2:has-text("Lupa Kata Sandi Akun Pasien")')).toBeVisible();

    await page.fill('input[placeholder="nama@email.com"]', 'bambang.wijaya@gmail.com');
    await page.click('button:has-text("Kirim Tautan Atur Ulang")');

    await expect(page.locator('text=Jika alamat email terdaftar di sistem')).toBeVisible();
  });
});
