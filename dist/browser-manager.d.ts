import { Browser, Page, BrowserContext } from 'playwright';
import { CaptureManager } from './capture-manager';
export interface BrowserSession {
    browser: Browser;
    context: BrowserContext;
    pages: Map<string, Page>;
    captureManager: CaptureManager;
    recordVideo: boolean;
}
export declare class BrowserManager {
    private session;
    private pageCounter;
    launch(options?: {
        width?: number;
        height?: number;
        slowMo?: number;
        recordVideo?: boolean;
    }): Promise<{
        sessionId: string;
        message: string;
    }>;
    newPage(name?: string): Promise<{
        pageId: string;
        message: string;
    }>;
    navigate(pageId: string, url: string): Promise<{
        message: string;
        title: string;
    }>;
    screenshot(pageId: string, options?: {
        fullPage?: boolean;
        selector?: string;
    }): Promise<{
        path: string;
        base64: string;
        message: string;
    }>;
    getPageContent(pageId: string): Promise<{
        html: string;
        text: string;
    }>;
    getVisibleElements(pageId: string): Promise<{
        elements: Array<{
            tag: string;
            text: string;
            id?: string;
            classes?: string[];
            href?: string;
            selector: string;
        }>;
    }>;
    click(pageId: string, selector: string): Promise<{
        message: string;
    }>;
    type(pageId: string, selector: string, text: string): Promise<{
        message: string;
    }>;
    waitForSelector(pageId: string, selector: string, timeout?: number): Promise<{
        message: string;
    }>;
    evaluate(pageId: string, script: string): Promise<{
        result: any;
    }>;
    closePage(pageId: string): Promise<{
        message: string;
    }>;
    close(): Promise<{
        message: string;
        cleanedUp: string[];
    }>;
    getPage(pageId: string): Page;
    isRunning(): boolean;
    getSessionInfo(): {
        running: boolean;
        pageCount: number;
        pages: string[];
        captureDir?: string;
    };
}
//# sourceMappingURL=browser-manager.d.ts.map