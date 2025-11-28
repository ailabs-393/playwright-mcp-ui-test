import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class CaptureManager {
  private captureDir: string = '';
  private screenshotDir: string = '';
  private videoDir: string = '';
  private screenshotCounter = 0;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create a unique temporary directory for this session
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    this.captureDir = path.join(os.tmpdir(), `playwright-ui-mcp-${timestamp}-${randomSuffix}`);
    this.screenshotDir = path.join(this.captureDir, 'screenshots');
    this.videoDir = path.join(this.captureDir, 'videos');

    // Create directories
    await fs.promises.mkdir(this.screenshotDir, { recursive: true });
    await fs.promises.mkdir(this.videoDir, { recursive: true });

    this.initialized = true;
  }

  // Lazy initialization - only creates dirs when actually needed
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCaptureDir(): string {
    return this.captureDir;
  }

  getScreenshotDir(): string {
    return this.screenshotDir;
  }

  getVideoDir(): string {
    return this.videoDir;
  }

  getScreenshotPath(name?: string): string {
    const filename = name || `screenshot_${++this.screenshotCounter}_${Date.now()}.png`;
    return path.join(this.screenshotDir, filename);
  }

  async readScreenshotAsBase64(filePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString('base64');
  }

  async listCaptures(): Promise<{
    screenshots: string[];
    videos: string[];
  }> {
    const screenshots = await this.listFiles(this.screenshotDir);
    const videos = await this.listFiles(this.videoDir);
    return { screenshots, videos };
  }

  private async listFiles(dir: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(dir);
      return files.map(f => path.join(dir, f));
    } catch {
      return [];
    }
  }

  async cleanup(): Promise<string[]> {
    // Nothing to clean up if never initialized
    if (!this.initialized) {
      return [];
    }

    const cleanedUp: string[] = [];

    // Remove all files in capture directories
    const { screenshots, videos } = await this.listCaptures();

    for (const file of [...screenshots, ...videos]) {
      try {
        await fs.promises.unlink(file);
        cleanedUp.push(file);
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Remove directories
    try {
      await fs.promises.rmdir(this.screenshotDir);
      await fs.promises.rmdir(this.videoDir);
      await fs.promises.rmdir(this.captureDir);
    } catch {
      // Directories might not be empty, try recursive delete
      try {
        await fs.promises.rm(this.captureDir, { recursive: true, force: true });
      } catch {
        // Ignore final cleanup errors
      }
    }

    this.initialized = false;
    return cleanedUp;
  }

  async getScreenshotForAnalysis(filePath: string): Promise<{
    base64: string;
    mimeType: string;
    width?: number;
    height?: number;
  }> {
    const buffer = await fs.promises.readFile(filePath);
    const base64 = buffer.toString('base64');

    return {
      base64,
      mimeType: 'image/png',
    };
  }
}
