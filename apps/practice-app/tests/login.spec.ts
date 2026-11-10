import { test, expect } from '@playwright/test';
import { loadAppConfig } from '../../../core/config-loader';
import { BasePage } from '../../../core/base-page';

const config = loadAppConfig('practice-app', 'staging');

test.describe('Generic Core Framework Proof', () => {
    test('Should login successfully driven purely by config', async ({ page }) => {
        const basePage = new BasePage(page);

        await basePage.navigate(config.baseUrl);
        await page.locator(config.selectors.usernameInput).fill(config.credentials.testUser.username);
        await page.locator(config.selectors.passwordInput).fill(config.credentials.testUser.password);

        // Bypasses WebKit's strict element stability check on Ubuntu
        await page.locator(config.selectors.loginButton).click({ force: true });

        await expect(page.locator(config.selectors.inventoryContainer)).toBeVisible();
        await basePage.captureScreenshot('practice-login-success');
    });
});