#!/usr/bin/env npx ts-node

/**
 * Interactive test - keeps browser open longer so you can observe
 * Run with: npx ts-node test/test-interactive.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function getText(result: any): string {
  return result.content?.[0]?.text || '';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runInteractiveTest() {
  console.log('🎭 Interactive MCP Browser Test');
  console.log('================================\n');
  console.log('Watch the browser window to see actions in real-time!\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/index.js'],
  });

  const client = new Client({
    name: 'interactive-test',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Launch browser with slowMo so actions are visible
    console.log('🚀 Launching browser with slowMo=200ms for visibility...');
    await client.callTool({
      name: 'browser_launch',
      arguments: { slowMo: 200 },
    });
    console.log('✅ Browser launched\n');
    await sleep(1000);

    // Create a page
    console.log('📄 Creating new page...');
    await client.callTool({
      name: 'browser_new_page',
      arguments: { name: 'main' },
    });
    await sleep(500);

    // Navigate to Wikipedia
    console.log('🌐 Navigating to Wikipedia...');
    const navResult: any = await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://en.wikipedia.org' },
    });
    console.log('✅', JSON.parse(getText(navResult)).title);
    await sleep(2000);

    // Take screenshot
    console.log('\n📸 Taking screenshot of homepage...');
    await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    console.log('✅ Screenshot captured\n');
    await sleep(1000);

    // Get visible elements
    console.log('🔍 Finding interactive elements...');
    const elementsResult: any = await client.callTool({
      name: 'browser_get_visible_elements',
      arguments: { pageId: 'main' },
    });
    const elements = JSON.parse(getText(elementsResult)).elements;
    console.log(`✅ Found ${elements.length} interactive elements\n`);
    await sleep(1000);

    // Find the search input
    console.log('⌨️  Typing "Claude AI" in search box...');
    await client.callTool({
      name: 'browser_type',
      arguments: {
        pageId: 'main',
        selector: 'input[name="search"]',
        text: 'Claude AI'
      },
    });
    console.log('✅ Text entered\n');
    await sleep(2000);

    // Take another screenshot
    console.log('📸 Taking screenshot with search text...');
    await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    await sleep(1000);

    // Click search button
    console.log('🖱️  Clicking search button...');
    await client.callTool({
      name: 'browser_click',
      arguments: {
        pageId: 'main',
        selector: 'button[type="submit"]'
      },
    });
    console.log('✅ Search submitted\n');
    await sleep(3000);

    // Wait for results
    console.log('⏳ Waiting for search results...');
    await client.callTool({
      name: 'browser_wait_for',
      arguments: {
        pageId: 'main',
        selector: '.mw-search-results, #mw-content-text',
        timeout: 10000
      },
    });
    console.log('✅ Results loaded\n');
    await sleep(2000);

    // Take screenshot of results
    console.log('📸 Taking screenshot of search results...');
    await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main' },
    });
    await sleep(1000);

    // Get page content
    console.log('📝 Getting page content...');
    const contentResult: any = await client.callTool({
      name: 'browser_get_content',
      arguments: { pageId: 'main' },
    });
    const content = JSON.parse(getText(contentResult));
    console.log(`✅ Page has ${content.htmlLength} chars of HTML\n`);
    console.log('First 200 chars of text:');
    console.log(`"${content.textContent.substring(0, 200)}..."\n`);
    await sleep(2000);

    // Execute some JavaScript
    console.log('🔧 Executing JavaScript to get page info...');
    const evalResult: any = await client.callTool({
      name: 'browser_evaluate',
      arguments: {
        pageId: 'main',
        script: '({ url: window.location.href, title: document.title, links: document.querySelectorAll("a").length })'
      },
    });
    console.log('✅ JS Result:', JSON.parse(getText(evalResult)).result);
    await sleep(2000);

    // Navigate to another page
    console.log('\n🌐 Navigating to GitHub...');
    await client.callTool({
      name: 'browser_navigate',
      arguments: { pageId: 'main', url: 'https://github.com/anthropics' },
    });
    console.log('✅ Loaded GitHub\n');
    await sleep(3000);

    // Screenshot GitHub
    console.log('📸 Taking screenshot of GitHub...');
    await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'main', fullPage: false },
    });
    await sleep(2000);

    // Get status
    console.log('\n📊 Getting browser status...');
    const statusResult: any = await client.callTool({
      name: 'browser_status',
      arguments: {},
    });
    console.log('Status:', getText(statusResult));

    // Keep browser open for observation
    console.log('\n👀 Browser will stay open for 10 more seconds...');
    console.log('   (Observe the browser window!)\n');
    await sleep(10000);

    // Close
    console.log('🧹 Closing browser and cleaning up...');
    const closeResult: any = await client.callTool({
      name: 'browser_close',
      arguments: {},
    });
    const closeData = JSON.parse(getText(closeResult));
    console.log('✅', closeData.message);
    console.log(`   Cleaned up ${closeData.cleanedUp.length} files\n`);

    console.log('🎉 Interactive test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    // Try to close browser on error
    try {
      await client.callTool({ name: 'browser_close', arguments: {} });
    } catch {}
  } finally {
    await client.close();
  }
}

runInteractiveTest();
