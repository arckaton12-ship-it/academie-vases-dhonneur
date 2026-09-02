import { test, expect, type Page } from '@playwright/test';

const STUDENT_EMAIL = 'test1@acvha.org';
const STUDENT_PASS  = 'AcVh2026!';

async function loginStudent(page: Page) {
  await page.goto('/etudiant/connexion', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill(STUDENT_EMAIL);
  await page.locator('#password').fill(STUDENT_PASS);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/etudiant\//, { timeout: 30_000 });
  await expect(page.locator('body')).toContainText(/Parcours|Semaine|Cours/i, { timeout: 15_000 });
}

function makePng(): Buffer {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return Buffer.from(base64, 'base64');
}

test.describe('CONSIGNE: upload résumé + XP', () => {
  test('étudiant importe puis retire un fichier résumé', async ({ page }) => {
    await loginStudent(page);

    const label = page.locator('label:has-text("Importer mon résumé")').first();
    await expect(label).toBeVisible({ timeout: 20_000 });

    const fileInput = label.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: 'resume-test.png', mimeType: 'image/png', buffer: makePng() });

    await expect(page.locator('img[alt="Résumé joint"]')).toBeVisible({ timeout: 30_000 });

    const retirer = page.locator('button:has-text("Retirer")').first();
    await expect(retirer).toBeVisible({ timeout: 15_000 });
    await retirer.click();
    await expect(page.locator('button:has-text("Retirer")')).toHaveCount(0, { timeout: 20_000 });
  });

  test('le dashboard étudiant montre les indicateurs de progression/XP', async ({ page }) => {
    await loginStudent(page);
    await expect(page.locator('body')).toContainText(/R[eé]sum[eé]s faits|XP|D[eé]fis|progression/i, { timeout: 20_000 });
  });
});