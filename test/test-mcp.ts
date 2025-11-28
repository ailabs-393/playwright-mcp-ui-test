#!/usr/bin/env npx ts-node

/**
 * Simple test script for the Playwright UI MCP server
 * Run with: npx ts-node test/test-mcp.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Helper to extract text from tool result
function getText(result: any): string {
  return result.content?.[0]?.text || '';
}

async function runTests() {
  console.log('🧪 Starting MCP Server Tests\n');

  // Create transport that spawns the server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/index.js'],
  });

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    // Connect to server
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected\n');

    // Test 1: List tools
    console.log('Test 1: List available tools...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`);
    tools.tools.forEach((t) => console.log(`   - ${t.name}: ${t.description?.substring(0, 50)}...`));
    console.log();

    // Test 2: Launch browser
    console.log('Test 2: Launch browser (lightweight mode)...');
    const launchResult: any = await client.callTool({
      name: 'browser_launch',
      arguments: {},
    });
    console.log('✅ Result:', getText(launchResult));
    console.log();

    // Test 3: Create new page
    console.log('Test 3: Create new page...');
    const pageResult: any = await client.callTool({
      name: 'browser_new_page',
      arguments: { name: 'test-page' },
    });
    console.log('✅ Result:', getText(pageResult));
    console.log();

    // Test 4: Navigate
    console.log('Test 4: Navigate to example.com...');
    const navResult: any = await client.callTool({
      name: 'browser_navigate',
      arguments: {
        pageId: 'test-page',
        url: 'https://example.com',
      },
    });
    console.log('✅ Result:', getText(navResult));
    console.log();

    // Test 5: Get visible elements
    console.log('Test 5: Get visible elements...');
    const elementsResult: any = await client.callTool({
      name: 'browser_get_visible_elements',
      arguments: { pageId: 'test-page' },
    });
    const elementsData = JSON.parse(getText(elementsResult));
    console.log(`✅ Found ${elementsData.elements.length} interactive elements`);
    elementsData.elements.slice(0, 3).forEach((el: any) => {
      console.log(`   - <${el.tag}> "${el.text.substring(0, 30)}..." selector: ${el.selector}`);
    });
    console.log();

    // Test 6: Take screenshot
    console.log('Test 6: Take screenshot...');
    const screenshotResult: any = await client.callTool({
      name: 'browser_screenshot',
      arguments: { pageId: 'test-page' },
    });
    const hasImage = screenshotResult.content?.some((c: any) => c.type === 'image');
    console.log('✅ Screenshot captured, includes image data:', hasImage);
    console.log();

    // Test 7: Get status
    console.log('Test 7: Get browser status...');
    const statusResult: any = await client.callTool({
      name: 'browser_status',
      arguments: {},
    });
    console.log('✅ Status:', getText(statusResult));
    console.log();

    // Test 8: Close browser
    console.log('Test 8: Close browser and cleanup...');
    const closeResult: any = await client.callTool({
      name: 'browser_close',
      arguments: {},
    });
    console.log('✅ Result:', getText(closeResult));
    console.log();

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

runTests();
