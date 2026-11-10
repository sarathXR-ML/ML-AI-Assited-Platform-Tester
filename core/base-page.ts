import { Page } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(url: string) {
        await this.page.goto(url);
    }

    async captureScreenshot(stepName: string) {
        await this.page.screenshot({ path: `results-store/screenshots/${stepName}-${Date.now()}.png` });
    }
}