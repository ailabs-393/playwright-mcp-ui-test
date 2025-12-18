# playwright-ui-mcp
 <div align="center">                                                                              
                                                                                                    
  [![npm version](https://img.shields.io/npm/v/playwright-ui-mcp.svg)](https://www.npmjs.com/package/playwright-ui-mcp)                                                                               
  [![downloads](https://img.shields.io/npm/dt/playwright-ui-mcp.svg)](https://www.npmjs.com/package/playwright-ui-mcp)                                                                                
  [![license](https://img.shields.io/npm/l/playwright-ui-mcp.svg)](https://github.com/ailabs-393/playwright-ui-mcp/blob/main/LICENSE)                                                                 
  [![Node.js](https://img.shields.io/node/v/playwright-ui-mcp.svg)](https://nodejs.org)             
                                                                                                    
  </div> 
  
A lightweight MCP (Model Context Protocol) server for headed browser UI capture and analysis using Playwright. Designed for use with Claude to enable visual UI inspection, screenshots, and browser automation.

## Features

- **Headed browser** - Always visible, not headless, for real UI analysis
- **Lightweight by default** - No video recording unless explicitly enabled
- **Screenshot capture** - Returns base64 images for Claude to analyze
- **Video recording** - Optional, enable only when needed
- **Auto cleanup** - All screenshots/videos deleted when browser closes
- **Interactive elements** - Get clickable elements with selectors

## Installation

### Automatic Install (Recommended)

Install as a dependency in your project. The configuration (`.mcp.json`) is created automatically.

```bash
npm install playwright-ui-mcp
```

### Quick Setup (Without Installing)

If you just want to configure the current directory without adding a dependency:

```bash
npx playwright-ui-mcp-install
```

### Manual Configuration

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "playwright-ui": {
      "command": "npx",
      "args": ["-y", "playwright-ui-mcp"]
    }
  }
}
```

Then restart Claude Code or run `/mcp` to load the server.

## Available Tools

| Tool | Description |
|------|-------------|
| `browser_launch` | Launch headed browser. Options: `width`, `height`, `slowMo`, `recordVideo` |
| `browser_new_page` | Create a new tab |
| `browser_navigate` | Navigate to URL |
| `browser_screenshot` | Capture screenshot (returns base64 image for analysis) |
| `browser_get_visible_elements` | Get interactive elements with selectors |
| `browser_get_content` | Get page HTML and text |
| `browser_click` | Click an element |
| `browser_type` | Type into input field |
| `browser_wait_for` | Wait for element to appear |
| `browser_evaluate` | Run JavaScript in page |
| `browser_close_page` | Close a specific tab |
| `browser_close` | Close browser and cleanup all captures |
| `browser_status` | Get session info |

## Usage Examples

### Basic UI Inspection

Ask Claude:
> "Open a browser, go to https://example.com, and describe what you see"

Claude will:
1. Launch browser
2. Navigate to the URL
3. Take a screenshot
4. Analyze the UI visually
5. Close browser (auto-cleanup)

### Form Interaction

> "Go to the login page, fill in username 'test@example.com' and password 'secret', then click submit"

### With Video Recording (Heavy Mode)

> "Record a video while you navigate through the checkout flow"

Claude will use `recordVideo: true` when launching.

## Lightweight vs Heavy Mode

| Mode | Video | slowMo | Use Case |
|------|-------|--------|----------|
| **Default (Light)** | Off | None | Quick UI checks |
| **Heavy** | On | 100-200ms | Debugging, demos |

```javascript
// Lightweight (default)
browser_launch()

// Heavy mode for debugging
browser_launch({ recordVideo: true, slowMo: 150 })
```

## Cleanup

All temporary files (screenshots, videos) are **automatically deleted** when `browser_close` is called. No manual cleanup required.

## Uninstall

Remove from project:

```bash
npx playwright-ui-mcp-install uninstall
```

## Requirements

- Node.js >= 18.0.0
- Chromium browser (auto-installed via Playwright on first run)

## License

MIT
