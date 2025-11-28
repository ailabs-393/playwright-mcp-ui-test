#!/usr/bin/env npx ts-node

/**
 * Test that keeps screenshots for viewing
 * Run with: npx ts-node test/test-keep-screenshots.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as fs from 'fs';
import * as path from 'path';

function getText(result: any): string {
  return result.content?.[0]?.text || '';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Save screenshots to a local folder instead of temp
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots');

async function runTest() {
  console.log('📸 Screenshot Test - Files will be kept for viewing');
  console.log('===================================================\n');

  // Create local screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/index.js'],
  });

  const client = new Client({
    name: 'screenshot-test',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected\n');

    // Launch browser
    console.log('🚀 Launching browser...');
    await client.callTool({
      name: 'browser_launch',
      arguments: { slowMo: 100 },
    });

    await client.callTool({
      name: 'browser_new_page',
      arguments: { name: 'main' },
    });
    await sleep(500);

    // Screenshot 1: Wikipedia homepage
    console.log('\n📸 Screenshot 1: Wikipedia homepage...');
    await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://en.wikipedia.org' },
    });
    await sleep(1000);

    const ss1: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    const img1 = ss1.content?.find((c: any) => c.type === 'image');
    if (img1) {
      const file1 = path.join(SCREENSHOT_DIR, '01-wikipedia-home.png');
      fs.writeFileSync(file1, Buffer.from(img1.data, 'base64'));
      console.log(`   ✅ Saved: ${file1}`);
    }

    // Screenshot 2: Search for Claude
    console.log('\n📸 Screenshot 2: Searching for "Claude AI"...');
    await client.callTool({
      name: 'browser_type',
      arguments: { pageId: 'main', selector: 'input[name="search"]', text: 'Claude AI' },
    });
    await sleep(1000);

    const ss2: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    const img2 = ss2.content?.find((c: any) => c.type === 'image');
    if (img2) {
      const file2 = path.join(SCREENSHOT_DIR, '02-search-typed.png');
      fs.writeFileSync(file2, Buffer.from(img2.data, 'base64'));
      console.log(`   ✅ Saved: ${file2}`);
    }

    // Screenshot 3: Search results
    console.log('\n📸 Screenshot 3: Search results...');
    await client.callTool({
      name: 'browser_click',
      arguments: { pageId: 'main', selector: 'button[type="submit"]' },
    });
    await sleep(2000);

    const ss3: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    const img3 = ss3.content?.find((c: any) => c.type === 'image');
    if (img3) {
      const file3 = path.join(SCREENSHOT_DIR, '03-search-results.png');
      fs.writeFileSync(file3, Buffer.from(img3.data, 'base64'));
      console.log(`   ✅ Saved: ${file3}`);
    }

    // Screenshot 4: GitHub
    console.log('\n📸 Screenshot 4: GitHub Anthropics page...');
    await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://github.com/anthropics' },
    });
    await sleep(2000);

    const ss4: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    const img4 = ss4.content?.find((c: any) => c.type === 'image');
    if (img4) {
      const file4 = path.join(SCREENSHOT_DIR, '04-github-anthropics.png');
      fs.writeFileSync(file4, Buffer.from(img4.data, 'base64'));
      console.log(`   ✅ Saved: ${file4}`);
    }

    // Screenshot 5: Full page screenshot
    console.log('\n📸 Screenshot 5: Full page capture...');
    const ss5: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main', fullPage: true },
    });
    const img5 = ss5.content?.find((c: any) => c.type === 'image');
    if (img5) {
      const file5 = path.join(SCREENSHOT_DIR, '05-github-fullpage.png');
      fs.writeFileSync(file5, Buffer.from(img5.data, 'base64'));
      console.log(`   ✅ Saved: ${file5}`);
    }

    // Close browser (cleans up temp files, but we saved copies locally)
    console.log('\n🧹 Closing browser...');
    await client.callTool({
      name: 'browser_close',
      arguments: {},
    });

    console.log('\n' + '='.repeat(50));
    console.log('📁 Screenshots saved to:');
    console.log(`   ${SCREENSHOT_DIR}`);
    console.log('\nFiles:');
    fs.readdirSync(SCREENSHOT_DIR).forEach(f => {
      const stats = fs.statSync(path.join(SCREENSHOT_DIR, f));
      console.log(`   - ${f} (${Math.round(stats.size / 1024)} KB)`);
    });
    console.log('\n🖼️  Open with:');
    console.log(`   open ${SCREENSHOT_DIR}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    try {
      await client.callTool({ name: 'browser_close', arguments: {} });
    } catch {}
  } finally {
    await client.close();
  }
}

runTest();
