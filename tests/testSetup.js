import { setup } from '../src/task/0-setup.js';
import { votePageTemplate } from '../src/task/vote-page-template.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function testSetup() {
    console.log('Starting setup test...');

    try {
        console.log('Running setup function...');
        await setup();

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
testSetup(); 