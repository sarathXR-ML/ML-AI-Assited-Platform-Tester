import { Page } from '@playwright/test';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginSelectors {
    usernameInput: string;
    passwordInput: string;
    loginButton: string;
    [key: string]: string | undefined;
}

/**
 * Generic login helper function driven purely by parameters.
 * Navigates to the specified URL, fills the username and password fields,
 * and clicks the login button using Playwright's built-in auto-waiting.
 */
export async function login(
    page: Page,
    url: string,
    credentials: LoginCredentials,
    selectors: LoginSelectors
): Promise<void> {
    await page.goto(url);
    await page.locator(selectors.usernameInput).fill(credentials.username);
    await page.locator(selectors.passwordInput).fill(credentials.password);
    await page.locator(selectors.loginButton).click();
}
