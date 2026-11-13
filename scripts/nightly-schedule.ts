import cron from 'node-cron';
import { exec } from 'child_process';
import * as path from 'path';

/**
 * Executes the entire Playwright test suite headlessly across all apps.
 * Results and artifacts are automatically persisted to results.db via SqliteReporter.
 */
export function runTestSuite(): Promise<void> {
    return new Promise((resolve) => {
        const startTime = new Date().toISOString();
        console.log(`\n========================================================`);
        console.log(`🌙 [${startTime}] Nightly Test Run Initiated`);
        console.log(`🚀 Executing: npx playwright test`);
        console.log(`========================================================\n`);

        const rootDir = path.resolve(__dirname, '..');

        exec('npx playwright test', { cwd: rootDir }, (error, stdout, stderr) => {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);

            const endTime = new Date().toISOString();
            console.log(`\n========================================================`);
            if (error) {
                console.log(`⚠️  [${endTime}] Nightly run completed with test failures (Exit code: ${error.code})`);
                console.log(`📊 Failures recorded to results.db. Run 'npx ts-node ai/triage.ts' to triage.`);
            } else {
                console.log(`✅ [${endTime}] All nightly tests passed successfully!`);
            }
            console.log(`========================================================\n`);
            resolve();
        });
    });
}

/**
 * Configures the scheduled cron job to run every night at 12:00 AM (midnight).
 * Cron Expression: '0 0 * * *' (Minute 0, Hour 0, Every day)
 */
export function startNightlyScheduler() {
    console.log('⏰ Initializing Mediant Labs Nightly Test Scheduler...');
    console.log("📅 Schedule: Every night at 12:00 AM (Cron: '0 0 * * *')");

    const task = cron.schedule('0 0 * * *', async () => {
        await runTestSuite();
    });

    console.log('🟢 Scheduler active. Waiting for scheduled triggers...');
    return task;
}

// Entrypoint
if (require.main === module) {
    const isRunNow = process.argv.includes('--run-now');

    if (isRunNow) {
        console.log('⚡ Immediate run requested via --run-now flag:');
        runTestSuite().then(() => {
            console.log('Immediate run finished. Starting background scheduler...');
            startNightlyScheduler();
        });
    } else {
        startNightlyScheduler();
    }

    // Keep process alive and handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Nightly scheduler terminated.');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log('\n🛑 Nightly scheduler terminated.');
        process.exit(0);
    });
}
