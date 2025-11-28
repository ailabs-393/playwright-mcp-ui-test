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
exports.CaptureManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class CaptureManager {
    captureDir = '';
    screenshotDir = '';
    videoDir = '';
    screenshotCounter = 0;
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
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
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }
    isInitialized() {
        return this.initialized;
    }
    getCaptureDir() {
        return this.captureDir;
    }
    getScreenshotDir() {
        return this.screenshotDir;
    }
    getVideoDir() {
        return this.videoDir;
    }
    getScreenshotPath(name) {
        const filename = name || `screenshot_${++this.screenshotCounter}_${Date.now()}.png`;
        return path.join(this.screenshotDir, filename);
    }
    async readScreenshotAsBase64(filePath) {
        const buffer = await fs.promises.readFile(filePath);
        return buffer.toString('base64');
    }
    async listCaptures() {
        const screenshots = await this.listFiles(this.screenshotDir);
        const videos = await this.listFiles(this.videoDir);
        return { screenshots, videos };
    }
    async listFiles(dir) {
        try {
            const files = await fs.promises.readdir(dir);
            return files.map(f => path.join(dir, f));
        }
        catch {
            return [];
        }
    }
    async cleanup() {
        // Nothing to clean up if never initialized
        if (!this.initialized) {
            return [];
        }
        const cleanedUp = [];
        // Remove all files in capture directories
        const { screenshots, videos } = await this.listCaptures();
        for (const file of [...screenshots, ...videos]) {
            try {
                await fs.promises.unlink(file);
                cleanedUp.push(file);
            }
            catch {
                // Ignore errors during cleanup
            }
        }
        // Remove directories
        try {
            await fs.promises.rmdir(this.screenshotDir);
            await fs.promises.rmdir(this.videoDir);
            await fs.promises.rmdir(this.captureDir);
        }
        catch {
            // Directories might not be empty, try recursive delete
            try {
                await fs.promises.rm(this.captureDir, { recursive: true, force: true });
            }
            catch {
                // Ignore final cleanup errors
            }
        }
        this.initialized = false;
        return cleanedUp;
    }
    async getScreenshotForAnalysis(filePath) {
        const buffer = await fs.promises.readFile(filePath);
        const base64 = buffer.toString('base64');
        return {
            base64,
            mimeType: 'image/png',
        };
    }
}
exports.CaptureManager = CaptureManager;
//# sourceMappingURL=capture-manager.js.map