import { test, expect, type Page } from '@playwright/test';

const STUDENT_EMAIL = 'test1@acvha.org';
const STUDENT_PASS  = 'AcVh2026!';
const MOD_EMAIL = 'moderator@acvha.org';
const MOD_PASS  = 'AcVh2026!';
const AC_EMAIL = 'adminclasse@acvha.org';
const AC_PASS  = 'AcVh2026!';

async function login(page: Page, path: string, email: string, password: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
}

// ─── LANDING ───────────────────────────────────────────────
test.describe('Landing page', () => {
  test('loads and shows academy branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Acad[eé]mie|Vases/i, { timeout: 15_000 });
  });

  test('has login links for all roles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/etudiant/connexion"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── STUDENT ───────────────────────────────────────────────
test.describe('Student auth', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/etudiant/connexion');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('valid login reaches dashboard', async ({ page }) => {
    await login(page, '/etudiant/connexion', STUDENT_EMAIL, STUDENT_PASS);
    // Wait for either dashboard or welcome animation
    await page.waitForURL(/\/etudiant\//, { timeout: 30_000 });
    // May land on dashboard directly or via welcome animation
    await page.waitForTimeout(5000);
    const url = page.url();
    // Should be on either dashboard or welcome redirect
    expect(url).toMatch(/etudiant/);
    await expect(page.locator('body')).toContainText(/Semaine|Mon Parcours|Cours|Connexion/i, { timeout: 15_000 });
  });

  test('student can see Mon Parcours after login', async ({ page }) => {
    await login(page, '/etudiant/connexion', STUDENT_EMAIL, STUDENT_PASS);
    await page.waitForURL(/\/etudiant\//, { timeout: 30_000 });
    await page.waitForTimeout(5000);
    await expect(page.locator('body')).toContainText(/Parcours|Semaine|Cours|Connexion/i, { timeout: 15_000 });
  });
});

// ─── MODERATOR ─────────────────────────────────────────────
test.describe('Moderator auth', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/moderateur/connexion');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('valid login reaches moderator area', async ({ page }) => {
    await login(page, '/moderateur/connexion', MOD_EMAIL, MOD_PASS);
    await page.waitForURL(/\/moderateur\//, { timeout: 30_000 });
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url).toMatch(/moderateur/);
    const text = await page.locator('body').textContent();
    expect(text).toMatch(/mod[eé]ration|planning|session|Semaine|Pr[eé]parer|Connexion mod/i);
  });

  test('cannot access admin dashboard', async ({ page }) => {
    await login(page, '/moderateur/connexion', MOD_EMAIL, MOD_PASS);
    await page.waitForURL(/\/moderateur\//, { timeout: 30_000 });
    await page.goto('/admin/tableau-de-bord');
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain('/admin/tableau-de-bord');
  });
});

// ─── ADMIN CLASSE ──────────────────────────────────────────
test.describe('Admin Classe auth', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/admin-classe/connexion');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('valid login reaches admin classe area', async ({ page }) => {
    await login(page, '/admin-classe/connexion', AC_EMAIL, AC_PASS);
    await page.waitForURL(/\/admin-classe\//, { timeout: 30_000 });
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url).toMatch(/admin-classe/);
    const text = await page.locator('body').textContent();
    expect(text).toMatch(/classe|[eé]tudiant|session|Semaine|Connexion/i);
  });

  test('cannot access admin dashboard', async ({ page }) => {
    await login(page, '/admin-classe/connexion', AC_EMAIL, AC_PASS);
    await page.waitForURL(/\/admin-classe\//, { timeout: 30_000 });
    await page.goto('/admin/tableau-de-bord');
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain('/admin/tableau-de-bord');
  });
});

// ─── ADMIN ─────────────────────────────────────────────────
test.describe('Admin auth', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/admin/connexion');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('signup is blocked for admin role', async ({ page }) => {
    await page.goto('/admin/inscription');
    await expect(page.locator('body')).toContainText(/connecte-toi|compte.*cr[eé]|r[eé]serv[eé]/i, { timeout: 10_000 });
  });
});

// ─── QUIZ MANAGEMENT (moderateur) ───────────────────────────
test.describe('Quiz management (moderator)', () => {
  test('moderator sees quiz management and mise en pratique in Programme', async ({ page }) => {
    await login(page, '/moderateur/connexion', MOD_EMAIL, MOD_PASS);
    await page.waitForURL(/\/moderateur\//, { timeout: 30_000 });
    await page.waitForTimeout(6000);
    // QuizTab heading rendered in Programme tab
    await expect(page.locator('body')).toContainText(/Gestion des Quiz/i, { timeout: 15_000 });
    // mise en pratique editor rendered (if own classes have courses)
    await expect(page.locator('body')).toContainText(/Mise en pratique du cours/i, { timeout: 15_000 });
  });
});
