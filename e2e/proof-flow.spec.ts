import { test, expect } from '@playwright/test';

const MOCK_PROOF = {
  ok: true,
  proof: {
    commitment:       '0xaabbccdd',
    eligibility_hash: '0x11223344',
    nullifier:        '0xdeadbeef',
    proof_bytes:      'abcdef1234567890abcdef1234567890abcdef12',
    public_inputs:    [],
  },
};

test.describe('Krypton Ledger — proof flow', () => {
  test('page loads with Connect Wallet button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
    await expect(page.getByText('Krypton Ledger')).toBeVisible();
  });

  test('submit button is disabled before wallet connect', async ({ page }) => {
    await page.goto('/');
    const submit = page.getByRole('button', { name: /generate/i });
    await expect(submit).toBeDisabled();
  });

  test('shows validation error for zero invoice amount', async ({ page }) => {
    await page.goto('/');
    // Connect wallet (ephemeral fallback in test env — no Freighter extension)
    await page.getByRole('button', { name: /connect wallet/i }).click();
    await expect(page.getByText(/ephemeral/i)).toBeVisible();

    await page.getByLabel(/invoice amount/i).fill('0');
    await page.getByLabel(/supplier id/i).fill('1');
    await page.getByLabel(/buyer id/i).fill('1');
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.getByRole('alert')).toContainText(/positive integer/i);
  });

  test('successful proof flow with mocked backend', async ({ page }) => {
    // Intercept the backend call and return a mock proof
    await page.route('**/api/prove-factoring', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROOF) })
    );

    await page.goto('/');
    await page.getByRole('button', { name: /connect wallet/i }).click();

    await page.getByLabel(/invoice amount/i).fill('50000');
    await page.getByLabel(/supplier id/i).fill('42');
    await page.getByLabel(/buyer id/i).fill('99');
    await page.getByRole('button', { name: /generate/i }).click();

    // Result panel should appear with commitment and nullifier
    await expect(page.getByText('✓ Proof generated')).toBeVisible();
    await expect(page.getByText('0xaabbccdd')).toBeVisible();
    await expect(page.getByText('0xdeadbeef')).toBeVisible();
  });

  test('shows error on backend 500', async ({ page }) => {
    await page.route('**/api/prove-factoring', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/');
    await page.getByRole('button', { name: /connect wallet/i }).click();

    await page.getByLabel(/invoice amount/i).fill('50000');
    await page.getByLabel(/supplier id/i).fill('42');
    await page.getByLabel(/buyer id/i).fill('99');
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.getByRole('alert')).toContainText(/500/);
  });

  test('copy button copies commitment to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.route('**/api/prove-factoring', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROOF) })
    );

    await page.goto('/');
    await page.getByRole('button', { name: /connect wallet/i }).click();

    await page.getByLabel(/invoice amount/i).fill('50000');
    await page.getByLabel(/supplier id/i).fill('42');
    await page.getByLabel(/buyer id/i).fill('99');
    await page.getByRole('button', { name: /generate/i }).click();

    await expect(page.getByText('✓ Proof generated')).toBeVisible();
    const copyButtons = page.getByRole('button', { name: /copy to clipboard/i });
    await copyButtons.first().click();
    await expect(copyButtons.first()).toContainText('copied!');
  });
});
