/*
 * @Date: 2025-07-14 15:18:27
 */
const fs = require('fs');
const path = require('path');

let config;

try {
  const configPath = path.join(__dirname, '../../config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Failed to load config file:', error);
  process.exit(1);
}

module.exports = {
  getConfig: () => config,
  getDatabaseConfig: () => config.database,
  getPathsConfig: () => config.paths,
  getScanConfig: () => config.scan,
  getServerConfig: () => config.server
};
