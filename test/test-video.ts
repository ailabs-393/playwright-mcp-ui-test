#!/usr/bin/env npx ts-node

/**
 * Test with video recording enabled
 * Run with: npx ts-node test/test-video.ts
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

const OUTPUT_DIR = path.join(process.cwd(), 'test-video-output');

async function runTest() {
  console.log('🎬 Video Recording Test');
  console.log('========================\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/index.js'],
  });

  const client = new Client({
    name: 'video-test',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  let captureDir = '';

  try {
    await client.connect(transport);
    console.log('✅ Connected\n');

    // Launch browser WITH video recording
    console.log('🚀 Launching browser with VIDEO RECORDING enabled...');
    const launchResult: any = await client.callTool({
      name: 'browser_launch',
      arguments: {
        slowMo: 150,  // Slow enough to see actions
        recordVideo: true  // Enable video!
      },
    });
    console.log('✅', JSON.parse(getText(launchResult)).message);
    console.log();

    // Create page
    await client.callTool({
      name: 'browser_new_page',
      arguments: { name: 'main' },
    });

    // Get capture dir for later
    const statusResult: any = await client.callTool({
      name: 'browser_status',
      arguments: {},
    });
    captureDir = JSON.parse(getText(statusResult)).captureDir;
    console.log(`📁 Video recording to: ${captureDir}/videos\n`);

    // Action 1: Go to Wikipedia
    console.log('🌐 Action 1: Navigate to Wikipedia...');
    await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://en.wikipedia.org' },
    });
    await sleep(2000);

    // Action 2: Type in search
    console.log('⌨️  Action 2: Type "Artificial Intelligence"...');
    await client.callTool({
      name: 'browser_type',
      arguments: {
        pageId: 'main',
        selector: 'input[name="search"]',
        text: 'Artificial Intelligence'
      },
    });
    await sleep(1500);

    // Action 3: Click search
    console.log('🖱️  Action 3: Click search...');
    await client.callTool({
      name: 'browser_click',
      arguments: { pageId: 'main', selector: 'button[type="submit"]' },
    });
    await sleep(3000);

    // Action 4: Scroll down (via JavaScript)
    console.log('📜 Action 4: Scroll down the page...');
    await client.callTool({
      name: 'browser_evaluate',
      arguments: {
        pageId: 'main',
        script: 'window.scrollBy(0, 500); "scrolled"'
      },
    });
    await sleep(1500);

    // Action 5: Navigate to another site
    console.log('🌐 Action 5: Navigate to GitHub...');
    await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://github.com/anthropics/claude-code' },
    });
    await sleep(3000);

    // Action 6: Scroll on GitHub
    console.log('📜 Action 6: Scroll GitHub page...');
    await client.callTool({
      name: 'browser_evaluate',
      arguments: {
        pageId: 'main',
        script: 'window.scrollBy(0, 800); "scrolled"'
      },
    });
    await sleep(2000);

    console.log('\n⏳ Keeping browser open for 3 more seconds...\n');
    await sleep(3000);

    // Close the PAGE first - this finalizes the video file
    console.log('📼 Closing page to finalize video...');
    await client.callTool({
      name: 'browser_close_page',
      arguments: { pageId: 'main' },
    });
    await sleep(2000); // Wait for video to be written

    // Copy video files BEFORE browser_close cleans them up
    console.log('💾 Saving video before cleanup...');
    const videoDir = path.join(captureDir, 'videos');
    if (fs.existsSync(videoDir)) {
      const videos = fs.readdirSync(videoDir);
      console.log(`   Found ${videos.length} video file(s)`);
      videos.forEach((video, i) => {
        const src = path.join(videoDir, video);
        const dest = path.join(OUTPUT_DIR, `recording-${i + 1}.webm`);
        fs.copyFileSync(src, dest);
        const stats = fs.statSync(dest);
        console.log(`   ✅ Saved: ${dest} (${Math.round(stats.size / 1024)} KB)`);
      });
    } else {
      console.log('   ⚠️ Video directory not found yet, videos may still be encoding...');
    }

    // Now close browser and cleanup temp files
    console.log('\n🧹 Closing browser...');
    await client.callTool({
      name: 'browser_close',
      arguments: {},
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎬 Video saved to:');
    console.log(`   ${OUTPUT_DIR}`);
    console.log('\n🖥️  Open with:');
    console.log(`   open ${OUTPUT_DIR}`);
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
