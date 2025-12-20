#!/usr/bin/env node

/**
 * Release script for uneventful
 *
 * Builds and pushes Docker image to Docker Hub.
 * Use `yarn version` to bump version first.
 *
 * Usage:
 *   yarn version --patch    # Bump version
 *   yarn release            # Build and push
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
  } catch (err) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

const dockerUsername = 'julianh2o';
const imageName = `${dockerUsername}/uneventful`;

log(`\n🚀 Building and Pushing Docker Image`, 'cyan');
log('═══════════════════════════════════════\n', 'cyan');

info(`Version: ${version}`);
info(`Image: ${imageName}\n`);

// Get git commit hash if available
let vcsRef = 'unknown';
try {
  vcsRef = exec('git rev-parse --short HEAD', { silent: true })?.trim() || 'unknown';
} catch (err) {
  // Git not available or not a git repo
}

const buildDate = new Date().toISOString();

// Build Docker image
info('Step 1/2: Building Docker image...');
log(`Building ${imageName}:${version}...`, 'yellow');

exec(
  `docker build ` +
  `--build-arg VERSION=${version} ` +
  `--build-arg BUILD_DATE=${buildDate} ` +
  `--build-arg VCS_REF=${vcsRef} ` +
  `-t ${imageName}:${version} ` +
  `-t ${imageName}:latest .`
);
success('Docker image built successfully');

// Push to Docker Hub
info('\nStep 2/2: Pushing to Docker Hub...');
log(`Pushing ${imageName}:${version}...`, 'yellow');
exec(`docker push ${imageName}:${version}`);
log(`Pushing ${imageName}:latest...`, 'yellow');
exec(`docker push ${imageName}:latest`);
success('Images pushed to Docker Hub');

// Summary
log('\n═══════════════════════════════════════', 'green');
log('🎉 Release Complete!', 'green');
log('═══════════════════════════════════════\n', 'green');

console.log(`Version:      ${version}`);
console.log(`Docker Image: ${imageName}:${version}`);
console.log(`              ${imageName}:latest`);
console.log(`\nPull image:   docker pull ${imageName}:${version}`);
console.log(`Run image:    docker run -p 2999:2999 ${imageName}:${version}\n`);
