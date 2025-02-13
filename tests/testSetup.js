import { setup } from '../src/task/0-setup.js';
import { votePageTemplate } from '../src/task/vote-page-template.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function testSetup() {
    console.log('Starting setup test...');

    try {
        // Test 1: Check if template exists
        if (!votePageTemplate) {
            throw new Error('Vote page template is not defined');
        }
        console.log('✅ Vote page template exists');

        // Test 2: Run setup function
        console.log('Running setup function...');
        const result = await setup();
        
        if (!result) {
            throw new Error('Setup function failed to return true');
        }
        console.log('✅ Setup function executed successfully');

        console.log('\nAll tests passed successfully! ✨');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
testSetup(); 