import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initDb, TestRunRecord } from '../core/db/init';
import { scrubSensitiveData } from './generator';

// Ensure .env file from workspace root is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface TriageResult {
    category: 'real bug' | 'test problem';
    ai_summary: string;
    healing_suggestion: string | null;
}

/**
 * Strips code fences if Claude wraps JSON in ```json ... ```
 */
function cleanJsonResponse(raw: string): string {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\r?\n/, '');
        cleaned = cleaned.replace(/\r?\n```$/, '');
    }
    return cleaned.trim();
}

/**
 * Analyzes a Playwright error message using the Claude API, categorizing it as a
 * "real bug" or "test problem", and generating selector healing suggestions if applicable.
 */
export async function triageErrorWithClaude(
    appName: string,
    testName: string,
    errorMessage: string
): Promise<TriageResult> {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error('Missing CLAUDE_API_KEY in .env file.');
    }

    const anthropic = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

    // Scrub sensitive data prior to transmitting to external API
    const sanitizedError = scrubSensitiveData(errorMessage);

    const systemPrompt = `You are an expert test automation triage engineer for Playwright test suites.
Analyze test failure error messages and classify the root cause.
Strict Rules:
1. Categorize the failure as strictly either:
   - "real bug" (e.g. application error 500, broken backend response, unexpected visual/functional defect)
   - "test problem" (e.g. broken locator, changed selector, timeout waiting for element, flakiness)
2. Generate a concise summary (1-2 sentences) explaining the cause and classification.
3. If the error is a broken or mismatched locator/selector, provide a concrete selector-healing suggestion.
   CRITICAL GOVERNANCE RULE: The system must NEVER auto-commit fixes. All healing suggestions are strictly for human review and approval. Format your suggestion with a clear "[FOR HUMAN APPROVAL ONLY]" disclaimer.
4. Output strictly valid JSON without any markdown formatting or commentary.

JSON schema:
{
  "category": "real bug" | "test problem",
  "ai_summary": "string",
  "healing_suggestion": "string" | null
}`;

    const userPrompt = `Target Application: ${appName}
Test Name: ${testName}

Error Details:
${sanitizedError}

Perform triage and provide your analysis in the required JSON format.`;

    const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
    });

    const firstContent = response.content[0];
    if (!firstContent || firstContent.type !== 'text') {
        throw new Error('Claude API did not return text response.');
    }

    const cleanedText = cleanJsonResponse(firstContent.text);
    try {
        const parsed = JSON.parse(cleanedText) as TriageResult;
        return {
            category: parsed.category === 'real bug' ? 'real bug' : 'test problem',
            ai_summary: parsed.ai_summary || 'No summary generated.',
            healing_suggestion: parsed.healing_suggestion || null,
        };
    } catch {
        // Fallback parsing if JSON parsing fails
        const isRealBug = /real bug/i.test(cleanedText);
        return {
            category: isRealBug ? 'real bug' : 'test problem',
            ai_summary: cleanedText.slice(0, 300),
            healing_suggestion: '[FOR HUMAN APPROVAL ONLY] Review selector and inspect current DOM snapshot.',
        };
    }
}

/**
 * Scans results.db for untriaged failed test runs, sends them to Claude API for triage,
 * and updates the database with the AI summary and selector healing suggestions.
 */
export async function triageFailures(): Promise<number> {
    const db = initDb();

    // Select all failed tests without an AI summary
    const stmt = db.prepare(`
        SELECT * FROM test_runs
        WHERE status = 'fail' AND (ai_summary IS NULL OR ai_summary = '')
        ORDER BY id ASC
    `);

    const untriaged = stmt.all() as TestRunRecord[];
    console.log(`🔍 Found ${untriaged.length} untriaged failed test run(s).`);

    if (untriaged.length === 0) {
        return 0;
    }

    const updateStmt = db.prepare(`
        UPDATE test_runs
        SET ai_summary = @ai_summary,
            healing_suggestion = @healing_suggestion
        WHERE id = @id
    `);

    let processed = 0;
    for (const run of untriaged) {
        console.log(`\n🤖 Triaging Run #${run.id} [${run.app_name}] "${run.test_name}"...`);

        try {
            const triage = await triageErrorWithClaude(
                run.app_name,
                run.test_name,
                run.error_message || 'Unknown failure'
            );

            const formattedSummary = `[${triage.category.toUpperCase()}] ${triage.ai_summary}`;

            updateStmt.run({
                id: run.id,
                ai_summary: formattedSummary,
                healing_suggestion: triage.healing_suggestion,
            });

            console.log(`✅ Triaged Run #${run.id}:`);
            console.log(`   Category:   ${triage.category}`);
            console.log(`   Summary:    ${triage.ai_summary}`);
            if (triage.healing_suggestion) {
                console.log(`   Suggestion: ${triage.healing_suggestion}`);
            }
            processed++;
        } catch (error) {
            console.error(`❌ Failed to triage Run #${run.id}:`, error);
        }
    }

    console.log(`\n🎉 Completed AI triage for ${processed} test failure(s).`);
    return processed;
}

if (require.main === module) {
    triageFailures().catch((err) => {
        console.error('Triage process failed:', err);
        process.exit(1);
    });
}
