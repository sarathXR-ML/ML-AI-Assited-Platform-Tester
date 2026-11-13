import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { triageFailures } from '../ai/triage';
import { initDb, TestRunRecord } from '../core/db/init';

function runCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr,
                code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
            });
        });

    });
}

async function main() {
    console.log('========================================================================');
    console.log('🚀 MEDIANT LABS - WEEK 2 END-OF-WEEK DEMO');
    console.log('   AI Failure Triage, Selector Healing & Intelligence Dashboard');
    console.log('========================================================================\n');

    const configPath = path.resolve(__dirname, '../apps/practice-app/config/staging.json');
    if (!fs.existsSync(configPath)) {
        throw new Error(`Practice app config not found at: ${configPath}`);
    }

    const originalConfigContent = fs.readFileSync(configPath, 'utf-8');

    try {
        // Step 1: Deliberately inject a broken selector into practice app config
        console.log('1️⃣  Injecting broken selector into apps/practice-app/config/staging.json...');
        const configObj = JSON.parse(originalConfigContent);
        const validSelector = configObj.selectors.inventoryContainer;
        const brokenSelector = "[data-test='broken-inventory-container-v2']";

        configObj.selectors.inventoryContainer = brokenSelector;
        fs.writeFileSync(configPath, JSON.stringify(configObj, null, 4), 'utf-8');
        console.log(`   - Original Selector: "${validSelector}"`);
        console.log(`   - Injected Selector: "${brokenSelector}"`);

        // Step 2: Run Playwright to generate a deterministic failure in results.db
        console.log('\n2️⃣  Running Playwright test to trigger failure and capture artifacts in SQLite...');
        const rootDir = path.resolve(__dirname, '..');
        const playCommand = 'npx playwright test apps/practice-app/tests/login.spec.ts --project=chromium';
        
        const testResult = await runCommand(playCommand, rootDir);
        console.log(`   - Playwright exited with code: ${testResult.code} (Expected failure)`);
        console.log('   - Result automatically persisted to results.db via custom SqliteReporter.');

    } finally {
        // Step 3: Always restore original configuration immediately
        console.log('\n3️⃣  Restoring original valid selector in staging config...');
        fs.writeFileSync(configPath, originalConfigContent, 'utf-8');
        console.log('   ✅ Config restored to clean state.');
    }

    // Step 4: Execute AI Failure Triage & Selector Healing
    console.log('\n4️⃣  Executing AI failure triage (ai/triage.ts)...');
    console.log('   - Querying results.db for untriaged test failures...');
    console.log('   - Calling Claude API for root-cause classification & selector healing...');

    await triageFailures();

    // Step 5: Fetch and display the triaged result from SQLite
    console.log('\n5️⃣  Verifying updated SQLite record in results.db:');
    const db = initDb();
    const latestFailure = db.prepare(`
        SELECT * FROM test_runs
        WHERE status = 'fail' AND ai_summary IS NOT NULL
        ORDER BY id DESC LIMIT 1
    `).get() as TestRunRecord | undefined;

    if (latestFailure) {
        console.log('------------------------------------------------------------------------');
        console.log(`📌 Run ID:             #${latestFailure.id}`);
        console.log(`📱 App:                ${latestFailure.app_name}`);
        console.log(`🧪 Test:               ${latestFailure.test_name}`);
        console.log(`❌ Status:             ${latestFailure.status.toUpperCase()}`);
        console.log(`🤖 AI Summary:         ${latestFailure.ai_summary}`);
        console.log(`🩹 Healing Suggestion: ${latestFailure.healing_suggestion}`);
        console.log(`📸 Screenshot:         ${latestFailure.screenshot_path || 'None'}`);
        console.log('------------------------------------------------------------------------');
    }

    console.log('\n========================================================================');
    console.log('🎉 WEEK 2 DEMO COMPLETE!');
    console.log('   Start the dashboard to view results in the UI:');
    console.log('   👉 node dashboard/server.js');
    console.log('   👉 Open in browser: http://localhost:4000');
    console.log('========================================================================\n');
}

if (require.main === module) {
    main().catch((err) => {
        console.error('Demo encountered an error:', err);
        process.exit(1);
    });
}
