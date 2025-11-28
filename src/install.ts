#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface McpConfig {
  mcpServers?: {
    [key: string]: {
      command: string;
      args: string[];
      cwd?: string;
    };
  };
}

const MCP_SERVER_NAME = 'playwright-ui';

async function install() {
  const cwd = process.cwd();
  const mcpConfigPath = path.join(cwd, '.mcp.json');

  console.log('🎭 Playwright UI MCP Installer');
  console.log('================================\n');
  console.log(`Installing MCP server in project scope: ${cwd}\n`);

  // Load existing config or create new one
  let config: McpConfig = { mcpServers: {} };

  if (fs.existsSync(mcpConfigPath)) {
    try {
      const existing = fs.readFileSync(mcpConfigPath, 'utf-8');
      config = JSON.parse(existing);
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      console.log('Found existing .mcp.json, updating...\n');
    } catch (err) {
      console.log('Found .mcp.json but could not parse, creating new...\n');
      config = { mcpServers: {} };
    }
  } else {
    console.log('Creating new .mcp.json...\n');
  }

  // Always use npx for portability - works regardless of install location
  const command = 'npx';
  const args = ['-y', 'playwright-ui-mcp'];

  // Add server config
  config.mcpServers![MCP_SERVER_NAME] = {
    command,
    args,
  };

  // Write config
  fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2) + '\n');

  console.log('✅ Successfully configured playwright-ui MCP server!\n');
  console.log('Configuration written to: .mcp.json (project scope only)\n');
  console.log('Available tools:');
  console.log('  - browser_launch      Launch headed browser');
  console.log('  - browser_new_page    Create new tab');
  console.log('  - browser_navigate    Navigate to URL');
  console.log('  - browser_screenshot  Capture screenshot for analysis');
  console.log('  - browser_click       Click element');
  console.log('  - browser_type        Type into input');
  console.log('  - browser_close       Close browser & cleanup captures\n');
  console.log('Restart Claude Code or run /mcp to load the server.\n');
}

async function uninstall() {
  const cwd = process.cwd();
  const mcpConfigPath = path.join(cwd, '.mcp.json');

  console.log('🎭 Playwright UI MCP Uninstaller');
  console.log('=================================\n');

  if (!fs.existsSync(mcpConfigPath)) {
    console.log('No .mcp.json found in current directory.\n');
    return;
  }

  try {
    const existing = fs.readFileSync(mcpConfigPath, 'utf-8');
    const config: McpConfig = JSON.parse(existing);

    if (config.mcpServers && config.mcpServers[MCP_SERVER_NAME]) {
      delete config.mcpServers[MCP_SERVER_NAME];

      // If no servers left, remove the file
      if (Object.keys(config.mcpServers).length === 0) {
        fs.unlinkSync(mcpConfigPath);
        console.log('✅ Removed .mcp.json (no other servers configured)\n');
      } else {
        fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2) + '\n');
        console.log('✅ Removed playwright-ui from .mcp.json\n');
      }
    } else {
      console.log('playwright-ui server not found in .mcp.json\n');
    }
  } catch (err) {
    console.error('Error reading .mcp.json:', err);
  }
}

// Main
const command = process.argv[2];

if (command === 'uninstall' || command === 'remove') {
  uninstall();
} else {
  install();
}
