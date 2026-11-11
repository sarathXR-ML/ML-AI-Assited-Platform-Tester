import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Ensure .env file from workspace root is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Scrubs potential passwords and secrets from plain-text flow descriptions
 * before transmitting them to external AI APIs.
 */
export function scrubSensitiveData(text: string): string {
    return text
        // Specific known test passwords
        .replace(/\bsecret_sauce\b/gi, '[REDACTED_PASSWORD]')
        // Key-value password patterns (e.g., password=foo, password: "bar")
        .replace(/(password\s*[:=]\s*)['"]?[^\s,'"]+['"]?/gi, '$1[REDACTED_PASSWORD]')
        // Descriptive patterns (e.g., "with password supersecret", "with secret 12345")
        .replace(/(with\s+(?:the\s+)?(?:password|secret)\s+)['"]?[^\s,'"]+['"]?/gi, '$1[REDACTED_PASSWORD]')
        // Credentials pair patterns like "and <password>" following username
        .replace(/(and\s+)(['"]?[A-Za-z0-9!@#$%^&*()_+=-]{8,}['"]?)(?=,|\s|$)/gi, (match, prefix, token) => {
            if (/^(then|verify|click|check|navigate)/i.test(token)) return match;
            return `${prefix}[REDACTED_PASSWORD]`;
        });
}

/**
 * Strips markdown code fences if Claude wraps the output in ```typescript ... ```
 */
function cleanGeneratedCode(code: string): string {
    let cleaned = code.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:typescript|ts)?\r?\n/, '');
        cleaned = cleaned.replace(/\r?\n```$/, '');
    }
    return cleaned.trim();
}

/**
 * Generates a Playwright TypeScript test draft from a plain-English flow description.
 *
 * @param flowDescription Plain-English user flow description
 * @param outputFileName Target test file name (without .spec.ts)
 * @returns Path to the generated test file
 */
export async function generateTestDraft(
    flowDescription: string,
    outputFileName: string
): Promise<string> {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
        throw new Error(
            'Missing or placeholder CLAUDE_API_KEY. Please provide a valid Anthropic API key in your .env file.'
        );
    }

    // 1. Read system prompt from version-controlled file
    const promptPath = path.resolve(__dirname, 'prompts/test-generator.txt');
    if (!fs.existsSync(promptPath)) {
        throw new Error(`System prompt file not found at: ${promptPath}`);
    }
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // 2. Scrub sensitive data (Security Requirement)
    const sanitizedDescription = scrubSensitiveData(flowDescription);
    console.log('🔒 Security Check: Flow description sanitized before API transmission:');
    console.log(`   Original:  "${flowDescription}"`);
    console.log(`   Sanitized: "${sanitizedDescription}"`);

    // 3. Initialize Anthropic client and call messages.create
    const anthropic = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    console.log(`🤖 Sending request to Claude API (${model})...`);

    const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: sanitizedDescription,
            },
        ],
    });

    const firstContent = response.content[0];
    if (!firstContent || firstContent.type !== 'text') {
        throw new Error('Did not receive a text response from Claude API.');
    }

    const generatedCode = cleanGeneratedCode(firstContent.text);

    // 4. Save generated test draft to target directory
    const outputDir = path.resolve(__dirname, '../apps/practice-app/tests');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${outputFileName}.spec.ts`);
    fs.writeFileSync(outputPath, generatedCode + '\n', 'utf-8');

    console.log(`✅ Test draft successfully generated and written to:`);
    console.log(`   ${outputPath}`);

    return outputPath;
}
