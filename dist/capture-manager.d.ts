export declare class CaptureManager {
    private captureDir;
    private screenshotDir;
    private videoDir;
    private screenshotCounter;
    private initialized;
    initialize(): Promise<void>;
    ensureInitialized(): Promise<void>;
    isInitialized(): boolean;
    getCaptureDir(): string;
    getScreenshotDir(): string;
    getVideoDir(): string;
    getScreenshotPath(name?: string): string;
    readScreenshotAsBase64(filePath: string): Promise<string>;
    listCaptures(): Promise<{
        screenshots: string[];
        videos: string[];
    }>;
    private listFiles;
    cleanup(): Promise<string[]>;
    getScreenshotForAnalysis(filePath: string): Promise<{
        base64: string;
        mimeType: string;
        width?: number;
        height?: number;
    }>;
}
//# sourceMappingURL=capture-manager.d.ts.map