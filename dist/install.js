#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MCP_SERVER_NAME = 'playwright-mcp-ui-test';
async function install() {
    const cwd = process.cwd();
    const mcpConfigPath = path.join(cwd, '.mcp.json');
    console.log('🎭 Playwright UI MCP Installer');
    console.log('================================\n');
    console.log(`Installing MCP server in project scope: ${cwd}\n`);
    // Load existing config or create new one
    let config = { mcpServers: {} };
    if (fs.existsSync(mcpConfigPath)) {
        try {
            const existing = fs.readFileSync(mcpConfigPath, 'utf-8');
            config = JSON.parse(existing);
            if (!config.mcpServers) {
                config.mcpServers = {};
            }
            console.log('Found existing .mcp.json, updating...\n');
        }
        catch (err) {
            console.log('Found .mcp.json but could not parse, creating new...\n');
            config = { mcpServers: {} };
        }
    }
    else {
        console.log('Creating new .mcp.json...\n');
    }
    // Get the path to the server - __dirname is 'dist' folder when compiled
    const serverPath = path.join(__dirname, 'index.js');
    // Always use npx for portability - this ensures it works regardless of
    // where the package is installed (global, local, npx cache, etc.)
    const command = 'npx';
    const args = ['-y', 'playwright-mcp-ui-test'];
    // Add server config
    config.mcpServers[MCP_SERVER_NAME] = {
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
        const config = JSON.parse(existing);
        if (config.mcpServers && config.mcpServers[MCP_SERVER_NAME]) {
            delete config.mcpServers[MCP_SERVER_NAME];
            // If no servers left, remove the file
            if (Object.keys(config.mcpServers).length === 0) {
                fs.unlinkSync(mcpConfigPath);
                console.log('✅ Removed .mcp.json (no other servers configured)\n');
            }
            else {
                fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2) + '\n');
                console.log('✅ Removed playwright-ui from .mcp.json\n');
            }
        }
        else {
            console.log('playwright-ui server not found in .mcp.json\n');
        }
    }
    catch (err) {
        console.error('Error reading .mcp.json:', err);
    }
}
// Main
const command = process.argv[2];
if (command === 'uninstall' || command === 'remove') {
    uninstall();
}
else {
    install();
}
//# sourceMappingURL=install.js.map