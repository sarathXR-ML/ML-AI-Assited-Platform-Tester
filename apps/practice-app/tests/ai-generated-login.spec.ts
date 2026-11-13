import { test, expect, Page } from '@playwright/test';

// Page Object: Login Page
class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('https://www.saucedemo.com');
  }

  async login(username: string, password: string) {
    await this.page.getByRole('textbox', { name: /username/i }).fill(username);
    await this.page.getByRole('textbox', { name: /password/i }).fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
}

// Page Object: Inventory Page
class InventoryPage {
  constructor(private page: Page) {}

  get inventoryContainer() {
    return this.page.getByTestId('inventory-container');
  }

  async isInventoryContainerVisible(): Promise<boolean> {
    return await this.inventoryContainer.isVisible();
  }
}

// Test
test('Login with standard_user and verify inventory container is visible', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  await loginPage.navigate();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(inventoryPage.inventoryContainer).toBeVisible();
});
