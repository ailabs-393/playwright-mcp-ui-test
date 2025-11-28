import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { CaptureManager } from './capture-manager';

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  pages: Map<string, Page>;
  captureManager: CaptureManager;
  recordVideo: boolean;
}

export class BrowserManager {
  private session: BrowserSession | null = null;
  private pageCounter = 0;

  async launch(options: {
    width?: number;
    height?: number;
    slowMo?: number;
    recordVideo?: boolean;
  } = {}): Promise<{ sessionId: string; message: string }> {
    if (this.session) {
      return {
        sessionId: 'default',
        message: 'Browser already running. Close it first or use the existing session.'
      };
    }

    const width = options.width || 1280;
    const height = options.height || 720;
    const recordVideo = options.recordVideo || false;

    const captureManager = new CaptureManager();
    // Only initialize capture dirs if video recording is enabled
    if (recordVideo) {
      await captureManager.initialize();
    }

    const browser = await chromium.launch({
      headless: false, // Always headed for UI analysis
      slowMo: options.slowMo, // No default delay - only if explicitly requested
      args: [
        `--window-size=${width},${height}`,
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const contextOptions: any = {
      viewport: { width, height }
    };

    // Only enable video recording if explicitly requested
    if (recordVideo) {
      contextOptions.recordVideo = {
        dir: captureManager.getVideoDir(),
        size: { width, height }
      };
    }

    const context = await browser.newContext(contextOptions);

    this.session = {
      browser,
      context,
      pages: new Map(),
      captureManager,
      recordVideo,
    };

    const message = recordVideo
      ? 'Headed browser launched with video recording enabled.'
      : 'Headed browser launched (lightweight mode, no video recording).';

    return { sessionId: 'default', message };
  }

  async newPage(name?: string): Promise<{ pageId: string; message: string }> {
    if (!this.session) {
      throw new Error('No browser session. Call launch() first.');
    }

    const pageId = name || `page_${++this.pageCounter}`;
    const page = await this.session.context.newPage();
    this.session.pages.set(pageId, page);

    return {
      pageId,
      message: `New page created with ID: ${pageId}`
    };
  }

  async navigate(pageId: string, url: string): Promise<{ message: string; title: string }> {
    const page = this.getPage(pageId);
    await page.goto(url, { waitUntil: 'networkidle' });
    const title = await page.title();
    return {
      message: `Navigated to ${url}`,
      title
    };
  }

  async screenshot(pageId: string, options: {
    fullPage?: boolean;
    selector?: string;
  } = {}): Promise<{ path: string; base64: string; message: string }> {
    const page = this.getPage(pageId);

    if (!this.session) {
      throw new Error('No browser session');
    }

    // Lazy init: ensure capture dirs exist when first screenshot is taken
    await this.session.captureManager.ensureInitialized();

    const screenshotPath = this.session.captureManager.getScreenshotPath();

    const screenshotOptions: any = {
      path: screenshotPath,
      fullPage: options.fullPage || false,
    };

    if (options.selector) {
      const element = await page.$(options.selector);
      if (element) {
        await element.screenshot({ path: screenshotPath });
      } else {
        throw new Error(`Selector "${options.selector}" not found`);
      }
    } else {
      await page.screenshot(screenshotOptions);
    }

    const base64 = await this.session.captureManager.readScreenshotAsBase64(screenshotPath);

    return {
      path: screenshotPath,
      base64,
      message: `Screenshot saved to ${screenshotPath}`,
    };
  }

  async getPageContent(pageId: string): Promise<{ html: string; text: string }> {
    const page = this.getPage(pageId);
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);
    return { html, text };
  }

  async getVisibleElements(pageId: string): Promise<{ elements: Array<{
    tag: string;
    text: string;
    id?: string;
    classes?: string[];
    href?: string;
    selector: string;
  }> }> {
    const page = this.getPage(pageId);

    const elements = await page.evaluate(() => {
      const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [onclick]';
      const nodes = document.querySelectorAll(interactiveSelectors);

      // Helper to generate unique selector using data attribute
      const processed: Element[] = [];

      return Array.from(nodes)
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 &&
                 rect.height > 0 &&
                 style.visibility !== 'hidden' &&
                 style.display !== 'none';
        })
        .slice(0, 100) // Limit to 100 elements
        .map((el, index) => {
          const tag = el.tagName.toLowerCase();
          const id = el.id || undefined;

          // Handle className safely (SVG elements have SVGAnimatedString)
          let classes: string[] | undefined;
          if (el.classList && el.classList.length > 0) {
            classes = Array.from(el.classList);
          }

          const text = (el.textContent || '').trim().substring(0, 100);
          const href = (el as HTMLAnchorElement).href || undefined;

          // Generate a unique selector
          let selector = tag;
          if (id) {
            selector = `#${id}`;
          } else if (classes && classes.length > 0) {
            // Try class-based selector, check if unique
            const classSelector = `${tag}.${classes[0]}`;
            if (document.querySelectorAll(classSelector).length === 1) {
              selector = classSelector;
            } else {
              // Use nth-of-type with parent context
              const parent = el.parentElement;
              if (parent) {
                const siblings = Array.from(parent.querySelectorAll(`:scope > ${tag}`));
                const idx = siblings.indexOf(el) + 1;
                selector = `${tag}:nth-of-type(${idx})`;
              } else {
                selector = `${tag}:nth-of-type(${index + 1})`;
              }
            }
          } else {
            // Fallback: use text content or index-based selector
            const parent = el.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll(`:scope > ${tag}`));
              const idx = siblings.indexOf(el) + 1;
              selector = `${tag}:nth-of-type(${idx})`;
            } else {
              selector = `${tag}:nth-of-type(${index + 1})`;
            }
          }

          processed.push(el);
          return { tag, text, id, classes, href, selector };
        });
    });

    return { elements };
  }

  async click(pageId: string, selector: string): Promise<{ message: string }> {
    const page = this.getPage(pageId);
    await page.click(selector, { timeout: 10000 });
    return { message: `Clicked on "${selector}"` };
  }

  async type(pageId: string, selector: string, text: string): Promise<{ message: string }> {
    const page = this.getPage(pageId);
    await page.fill(selector, text);
    return { message: `Typed "${text}" into "${selector}"` };
  }

  async waitForSelector(pageId: string, selector: string, timeout?: number): Promise<{ message: string }> {
    const page = this.getPage(pageId);
    await page.waitForSelector(selector, { timeout: timeout || 30000 });
    return { message: `Element "${selector}" is now visible` };
  }

  async evaluate(pageId: string, script: string): Promise<{ result: any }> {
    const page = this.getPage(pageId);
    const result = await page.evaluate(script);
    return { result };
  }

  async closePage(pageId: string): Promise<{ message: string }> {
    const page = this.session?.pages.get(pageId);
    if (!page) {
      throw new Error(`Page "${pageId}" not found`);
    }
    await page.close();
    this.session?.pages.delete(pageId);
    return { message: `Page "${pageId}" closed` };
  }

  async close(): Promise<{ message: string; cleanedUp: string[] }> {
    if (!this.session) {
      return { message: 'No browser session to close', cleanedUp: [] };
    }

    // Close all pages first
    for (const [, page] of this.session.pages) {
      await page.close();
    }
    this.session.pages.clear();

    // Close context to ensure videos are saved
    await this.session.context.close();

    // Close browser
    await this.session.browser.close();

    // Clean up all captured files (screenshots and videos)
    const cleanedUp = await this.session.captureManager.cleanup();

    this.session = null;
    this.pageCounter = 0;

    return {
      message: 'Browser closed and all captures cleaned up',
      cleanedUp
    };
  }

  getPage(pageId: string): Page {
    const page = this.session?.pages.get(pageId);
    if (!page) {
      throw new Error(`Page "${pageId}" not found. Available pages: ${Array.from(this.session?.pages.keys() || []).join(', ') || 'none'}`);
    }
    return page;
  }

  isRunning(): boolean {
    return this.session !== null;
  }

  getSessionInfo(): {
    running: boolean;
    pageCount: number;
    pages: string[];
    captureDir?: string;
  } {
    if (!this.session) {
      return { running: false, pageCount: 0, pages: [] };
    }
    return {
      running: true,
      pageCount: this.session.pages.size,
      pages: Array.from(this.session.pages.keys()),
      captureDir: this.session.captureManager.getCaptureDir(),
    };
  }
}
