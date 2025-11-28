# Playwright MCP UI Test Server

An MCP (Model Context Protocol) server that enables headed browser UI capture and analysis using Playwright. This tool allows Claude (or other MCP clients) to interact with web pages, take screenshots, and perform UI automation tasks in a visible browser window.

## Features

*   **Headed Browser**: Launches a visible Chromium browser for real-time observation.
*   **UI Interaction**: Click, type, navigate, and manage pages/tabs.
*   **Visual Analysis**: Capture screenshots (full page or element-specific) for analysis.
*   **Content Retrieval**: Extract HTML and text content from pages.
*   **Element Discovery**: Identify visible interactive elements with generated selectors.
*   **Session Management**: Robust handling of browser sessions and temporary file cleanup.
*   **Video Recording**: Optional video recording of sessions for debugging.

## Installation

### Prerequisites
*   Node.js >= 18.0.0
*   npm or yarn

### Setup
To install the server and configure it for your project:

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Build the project:
    ```bash
    npm run build
    ```

3.  Install the necessary Playwright browsers:
    ```bash
    npm run install-browsers
    ```

4.  Configure the MCP server:
    You can use the included install script to add the server to your local `.mcp.json` configuration:
    ```bash
    npm run start -- install
    ```
    
    Alternatively, you can manually run the built server using `node dist/index.js`.

## Available Tools

The server exposes the following tools via MCP:

| Tool Name | Description |
|-----------|-------------|
| `browser_launch` | Launch a headed browser. Options for viewport size, slowMo, and video recording. |
| `browser_new_page` | Create a new page/tab in the browser. |
| `browser_navigate` | Navigate a specific page to a URL. |
| `browser_screenshot` | Take a screenshot of a page or element. Returns base64 image data. |
| `browser_get_visible_elements` | Get a list of visible interactive elements with selectors. |
| `browser_get_content` | Get the HTML and text content of a page. |
| `browser_click` | Click on an element using a CSS selector. |
| `browser_type` | Type text into an input field. |
| `browser_wait_for` | Wait for a specific element to appear. |
| `browser_evaluate` | Execute custom JavaScript in the page context. |
| `browser_close_page` | Close a specific page/tab. |
| `browser_close` | Close the browser and clean up all resources. |
| `browser_status` | Get the current status of the browser session. |

## Development

### Building
```bash
npm run build
```

### Running Locally
To run the server directly (useful for testing via stdio):
```bash
npm start
```

### Development Mode
To run with `ts-node` for development:
```bash
npm run dev
```

## License

MIT
