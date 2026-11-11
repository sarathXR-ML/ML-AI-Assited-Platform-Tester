import * as fs from 'fs';
import * as path from 'path';

export function loadAppConfig(appName: string, env: string = 'staging') {
    const configPath = path.resolve(__dirname, `../apps/${appName}/config/${env}.json`);
    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found for ${appName} in ${env} environment.`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}