import { Page, expect } from '@playwright/test';

export async function loginAsPatient(page: Page, email = 'bambang.wijaya@gmail.com', password = 'PasienBambang123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/pasien', { timeout: 10000 });
  await expect(page.locator('text=Bambang Wijaya').first()).toBeVisible();
}

export async function loginAsFrontDesk(page: Page, email = 'resepsionis@poliklinik.id', password = 'StafFrontDesk2026!') {
  await page.goto('/staff');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/petugas', { timeout: 10000 });
}

export async function loginAsDoctor(page: Page, email = 'dr.budi@poliklinik.id', password = 'DokterBudi2026!') {
  await page.goto('/staff');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/klinis', { timeout: 10000 });
}
