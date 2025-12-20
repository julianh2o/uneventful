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

// Ensure buildx builder exists
info('Setting up Docker buildx...');
try {
  execSync('docker buildx inspect multiplatform', { stdio: 'pipe' });
  info('Using existing buildx builder');
} catch (err) {
  info('Creating buildx builder...');
  exec('docker buildx create --name multiplatform --use');
}

// Build and push multi-platform Docker image
info('Step 1/1: Building and pushing multi-platform Docker image...');
log(`Building ${imageName}:${version} for linux/amd64,linux/arm64...`, 'yellow');

exec(
  `docker buildx build ` +
  `--platform linux/amd64,linux/arm64 ` +
  `--build-arg VERSION=${version} ` +
  `--build-arg BUILD_DATE=${buildDate} ` +
  `--build-arg VCS_REF=${vcsRef} ` +
  `-t ${imageName}:${version} ` +
  `-t ${imageName}:latest ` +
  `--push .`
);
success('Multi-platform images built and pushed to Docker Hub');

// Summary
log('\n═══════════════════════════════════════', 'green');
log('🎉 Release Complete!', 'green');
log('═══════════════════════════════════════\n', 'green');

console.log(`Version:      ${version}`);
console.log(`Docker Image: ${imageName}:${version}`);
console.log(`              ${imageName}:latest`);
console.log(`\nPull image:   docker pull ${imageName}:${version}`);
console.log(`Run image:    docker run -p 2999:2999 ${imageName}:${version}\n`);
