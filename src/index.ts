#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser-manager';

const browserManager = new BrowserManager();

// Define all available tools
const tools: Tool[] = [
  {
    name: 'browser_launch',
    description: 'Launch a headed browser for UI capture and analysis. The browser will be visible on screen. By default runs in lightweight mode (no video). Enable recordVideo only when you need to capture a sequence of interactions for debugging or demonstration.',
    inputSchema: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Viewport width in pixels (default: 1280)',
        },
        height: {
          type: 'number',
          description: 'Viewport height in pixels (default: 720)',
        },
        slowMo: {
          type: 'number',
          description: 'Slow down operations by specified milliseconds. Only use when you need to visually observe actions.',
        },
        recordVideo: {
          type: 'boolean',
          description: 'Enable video recording of the session. Only enable when needed (e.g., debugging complex flows, capturing demos). Default: false',
        },
      },
    },
  },
  {
    name: 'browser_new_page',
    description: 'Create a new page/tab in the browser',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Optional name/ID for the page',
        },
      },
    },
  },
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL in a specific page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to navigate',
        },
        url: {
          type: 'string',
          description: 'The URL to navigate to',
        },
      },
      required: ['pageId', 'url'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page for UI analysis. Returns the screenshot as base64-encoded image data that can be analyzed.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to screenshot',
        },
        fullPage: {
          type: 'boolean',
          description: 'Capture full scrollable page (default: false)',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to screenshot a specific element',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'browser_get_visible_elements',
    description: 'Get all visible interactive elements on the page (buttons, links, inputs, etc.) with their selectors for interaction',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to analyze',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'browser_get_content',
    description: 'Get the HTML and text content of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to get content from',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'browser_click',
    description: 'Click on an element in the page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of the element to click',
        },
      },
      required: ['pageId', 'selector'],
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID',
        },
        selector: {
          type: 'string',
          description: 'CSS selector of the input element',
        },
        text: {
          type: 'string',
          description: 'Text to type',
        },
      },
      required: ['pageId', 'selector', 'text'],
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for an element to appear on the page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to wait for',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)',
        },
      },
      required: ['pageId', 'selector'],
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript code in the page context',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID',
        },
        script: {
          type: 'string',
          description: 'JavaScript code to execute',
        },
      },
      required: ['pageId', 'script'],
    },
  },
  {
    name: 'browser_close_page',
    description: 'Close a specific page/tab',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to close',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'browser_close',
    description: 'Close the browser and clean up all screenshots/recordings. IMPORTANT: Always call this when done with UI analysis to ensure proper cleanup.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_status',
    description: 'Get the current status of the browser session',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'playwright-mcp-ui-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'browser_launch': {
        const result = await browserManager.launch({
          width: args?.width as number,
          height: args?.height as number,
          slowMo: args?.slowMo as number,
          recordVideo: args?.recordVideo as boolean,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_new_page': {
        const result = await browserManager.newPage(args?.name as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_navigate': {
        const result = await browserManager.navigate(
          args?.pageId as string,
          args?.url as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_screenshot': {
        const result = await browserManager.screenshot(args?.pageId as string, {
          fullPage: args?.fullPage as boolean,
          selector: args?.selector as string,
        });

        // Return both text info and the image for analysis
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot captured: ${result.path}`,
            },
            {
              type: 'image',
              data: result.base64,
              mimeType: 'image/png',
            },
          ],
        };
      }

      case 'browser_get_visible_elements': {
        const result = await browserManager.getVisibleElements(
          args?.pageId as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_get_content': {
        const result = await browserManager.getPageContent(
          args?.pageId as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  textContent: result.text.substring(0, 10000), // Limit text content
                  htmlLength: result.html.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'browser_click': {
        const result = await browserManager.click(
          args?.pageId as string,
          args?.selector as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_type': {
        const result = await browserManager.type(
          args?.pageId as string,
          args?.selector as string,
          args?.text as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_wait_for': {
        const result = await browserManager.waitForSelector(
          args?.pageId as string,
          args?.selector as string,
          args?.timeout as number
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_evaluate': {
        const result = await browserManager.evaluate(
          args?.pageId as string,
          args?.script as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_close_page': {
        const result = await browserManager.closePage(args?.pageId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_close': {
        const result = await browserManager.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_status': {
        const result = browserManager.getSessionInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (browserManager.isRunning()) {
    await browserManager.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browserManager.isRunning()) {
    await browserManager.close();
  }
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Playwright UI MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
