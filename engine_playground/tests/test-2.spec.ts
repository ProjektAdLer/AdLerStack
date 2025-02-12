import { test, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('webgl debug info - chrome://gpu', async ({ page }) => {
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  await page.goto('chrome://gpu');
  await page.waitForTimeout(1000);
  
  // Get full page height
  const pageHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  });
  
  // Set viewport to match content
  await page.setViewportSize({ 
    width: 1920, 
    height: pageHeight 
  });
  
  await page.screenshot({
    path: path.join(testResultsDir, 'chrome-gpu.png'),
    fullPage: true
  });
});

test('Headless WebGL + GPU info', async () => {
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Launch Chromium in headless mode with GL flags
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--use-gl=egl',
      '--enable-webgl2'
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 1) Use CDP to fetch GPU info
  const cdp = await context.newCDPSession(page);
  const sysInfo = await cdp.send('SystemInfo.getInfo').catch(() => null);

  // 2) Check WebGL & WebGL2 via JavaScript
  // Navigate to an empty page (so we have a DOM to manipulate)
  await page.goto('about:blank');

  const webglInfo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (!gl2) {
      // Fallback to WebGL 1 check
      const gl1 = canvas.getContext('webgl');
      return {
        webgl2: false,
        webgl1: !!gl1,
        renderer: gl1 ? gl1.getParameter(gl1.RENDERER) : 'None'
      };
    }
    return {
      webgl2: true,
      renderer: gl2.getParameter(gl2.RENDERER),
      version: gl2.getParameter(gl2.VERSION)
    };
  });

  // 3) Write debug info to disk
  fs.writeFileSync(
    path.join(testResultsDir, 'gpu-info.json'),
    JSON.stringify({ sysInfo, webglInfo }, null, 2),
    'utf-8'
  );

  await browser.close();
});