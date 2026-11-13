import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { recordTestRun, initDb } from './init';
import * as path from 'path';

/**
 * Playwright custom reporter that automatically records every test result
 * (status, duration, error message, screenshots, videos) into results.db
 */
export default class SqliteReporter implements Reporter {
    private db = initDb();

    onTestEnd(test: TestCase, result: TestResult): void {
        // Derive app name from the test file path: apps/<appName>/...
        const filePath = test.location.file;
        const relPath = path.relative(process.cwd(), filePath);
        const match = relPath.match(/^apps\/([^/]+)/);
        const appName = match ? match[1] : 'general';

        // Extract error message if test failed
        let errorMessage: string | null = null;
        if (result.error) {
            errorMessage = result.error.message || result.error.stack || String(result.error.value || 'Test failed');
        }

        // Extract attachments (screenshots / video)
        let screenshotPath: string | null = null;
        let videoPath: string | null = null;

        if (result.attachments && result.attachments.length > 0) {
            for (const att of result.attachments) {
                if (att.name.toLowerCase().includes('screenshot') && att.path) {
                    screenshotPath = path.relative(process.cwd(), att.path);
                } else if (att.name.toLowerCase().includes('video') && att.path) {
                    videoPath = path.relative(process.cwd(), att.path);
                }
            }
        }

        const status: 'pass' | 'fail' = result.status === 'passed' ? 'pass' : 'fail';

        recordTestRun({
            app_name: appName,
            test_name: test.title,
            status,
            duration_ms: Math.round(result.duration),
            error_message: errorMessage,
            screenshot_path: screenshotPath,
            video_path: videoPath,
        }, this.db);
    }
}
