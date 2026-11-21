#!/usr/bin/env node
/**
 * Validate PNG assets referenced in Expo configuration.
 * Checks CRC of each PNG chunk to ensure file integrity.
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function validatePNG(filepath) {
  const buffer = fs.readFileSync(filepath);
  try {
    const png = PNG.sync.read(buffer);
    console.log(`✓ ${filepath}: ${png.width}x${png.height}, ${png.alpha ? 'with alpha' : 'no alpha'}`);
    return true;
  } catch (err) {
    console.error(`✗ ${filepath}: INVALID PNG - ${err.message}`);
    return false;
  }
}

function findPNGsInConfig(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const pngs = new Set();

  function extractPNGs(obj) {
    if (typeof obj === 'string' && obj.endsWith('.png')) {
      pngs.add(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(extractPNGs);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(extractPNGs);
    }
  }

  extractPNGs(config);
  return Array.from(pngs);
}

function main() {
  const configPath = path.join(__dirname, '../apps/customer/app.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  const pngRefs = findPNGsInConfig(configPath);
  console.log(`Found ${pngRefs.length} PNG references in app.json`);
  
  let allValid = true;
  for (const ref of pngRefs) {
    const fullPath = path.join(__dirname, '../apps/customer', ref);
    if (fs.existsSync(fullPath)) {
      if (!validatePNG(fullPath)) {
        allValid = false;
      }
    } else {
      console.error(`✗ ${ref}: FILE NOT FOUND`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log('\n✅ All PNG assets are valid');
    process.exit(0);
  } else {
    console.error('\n❌ Some PNG assets are invalid');
    process.exit(1);
  }
}

main();
