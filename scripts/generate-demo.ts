import { generateTestDraft } from '../ai/generator';

async function main() {
    console.log('========================================================');
    console.log('🚀 AI Test Draft Generation Demo (Week 1 Milestone)');
    console.log('========================================================\n');

    try {
        const flow = 'Log into the practice app with standard_user and secret_sauce, then verify the inventory container is visible';
        const outputFileName = 'ai-generated-login';

        console.log(`Input Flow: "${flow}"\n`);
        const resultPath = await generateTestDraft(flow, outputFileName);

        console.log('\n========================================================');
        console.log('🎉 Generation Complete! Ready for human review:');
        console.log(`   File: ${resultPath}`);
        console.log('========================================================');
    } catch (error) {
        console.error('\n❌ Generation failed:');
        if (error instanceof Error) {
            console.error(`   ${error.message}`);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

main();
