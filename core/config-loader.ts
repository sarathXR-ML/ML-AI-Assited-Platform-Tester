import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Ensure .env file from workspace root is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export function loadAppConfig(appName: string, env: string = 'staging') {
    const configPath = path.resolve(__dirname, `../apps/${appName}/config/${env}.json`);
    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found for ${appName} in ${env} environment.`);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Dynamically inject passwords from process.env into memory
    if (appName === 'addie-arcade') {
        if (!config.users) config.users = {};
        if (!config.users.standardUser) config.users.standardUser = {};
        config.users.standardUser.password = process.env.ADDIE_PASSWORD;
    } else if (appName === 'prism') {
        if (!config.users) config.users = {};
        if (!config.users.standardUser) config.users.standardUser = {};
        config.users.standardUser.password = process.env.PRISM_PASSWORD;
    }

    return config;
}