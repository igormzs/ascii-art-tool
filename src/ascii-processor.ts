export interface AsciiOptions {
    chars: string;
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
    bgColor: string;
    textColor: string;
    brightness: number;
    contrast: number;
    gamma: number;
    invert: boolean;
    originalBackground: boolean;
    customBgImage?: HTMLImageElement | null;
    customBgOpacity: number;
    customBgBw: boolean;
    renderMode: 'ascii' | 'halftone' | 'bitmap' | 'posterize' | 'tiles';
}

export class AsciiProcessor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private offscreenCanvas: HTMLCanvasElement;
    private offscreenCtx: CanvasRenderingContext2D;
    private options: AsciiOptions;
    
    constructor(canvas: HTMLCanvasElement, options: AsciiOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Failed to get 2D context");
        this.ctx = ctx;
        
        this.offscreenCanvas = document.createElement('canvas');
        const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
        if (!offCtx) throw new Error("Failed to get 2D context for offscreen canvas");
        this.offscreenCtx = offCtx;
        
        this.options = options;
    }

    public setOptions(options: AsciiOptions) {
        this.options = options;
    }

    public processFrame(imageSource: HTMLImageElement | HTMLVideoElement) {
        const { width, height } = this.calculateDimensions(imageSource);
        
        // Setup output canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Calculate grid based on font size
        const charWidth = this.options.fontSize * 0.6; // approx width for monospace
        const charHeight = this.options.fontSize;
        
        const cols = Math.floor(width / charWidth);
        const rows = Math.floor(height / charHeight);
        
        // Setup offscreen canvas to scale down the image to our grid size
        this.offscreenCanvas.width = cols;
        this.offscreenCanvas.height = rows;
        
        // Draw the image scaled down to the offscreen canvas
        this.offscreenCtx.drawImage(imageSource, 0, 0, cols, rows);
        const imageData = this.offscreenCtx.getImageData(0, 0, cols, rows);
        const pixels = imageData.data;
        
        // Prepare output canvas
        this.ctx.fillStyle = this.options.bgColor;
        this.ctx.fillRect(0, 0, width, height);

        if (this.options.customBgImage) {
            this.ctx.globalAlpha = this.options.customBgOpacity / 100;
            if (this.options.customBgBw) {
                this.ctx.filter = 'grayscale(100%)';
            }
            this.ctx.drawImage(this.options.customBgImage, 0, 0, width, height);
            this.ctx.filter = 'none';
            this.ctx.globalAlpha = 1.0;
        } else if (this.options.originalBackground) {
            this.ctx.drawImage(imageSource, 0, 0, width, height);
        }
        
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = `${this.options.fontWeight} ${this.options.fontSize}px ${this.options.fontFamily}`;
        this.ctx.textBaseline = 'top';

        const charList = this.options.chars;
        const charLen = charList.length;

        // Contrast calculation
        const contrastFactor = (259 * (this.options.contrast + 255)) / (255 * (259 - this.options.contrast));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = (y * cols + x) * 4;
                let r = pixels[i];
                let g = pixels[i + 1];
                let b = pixels[i + 2];
                
                // Brightness
                r += this.options.brightness - 100;
                g += this.options.brightness - 100;
                b += this.options.brightness - 100;
                
                // Contrast
                r = contrastFactor * (r - 128) + 128;
                g = contrastFactor * (g - 128) + 128;
                b = contrastFactor * (b - 128) + 128;

                // Clamp
                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                // Gamma correction
                r = 255 * Math.pow(r / 255, 1 / this.options.gamma);
                g = 255 * Math.pow(g / 255, 1 / this.options.gamma);
                b = 255 * Math.pow(b / 255, 1 / this.options.gamma);
                
                // Luminance
                let lum = 0.299 * r + 0.587 * g + 0.114 * b;
                
                if (this.options.invert) {
                    lum = 255 - lum;
                    r = 255 - r;
                    g = 255 - g;
                    b = 255 - b;
                }

                const px = x * charWidth;
                const py = y * charHeight;

                if (this.options.renderMode === 'ascii') {
                    const charIndex = Math.floor((1 - lum / 255) * (charLen - 1));
                    const clampedIndex = Math.max(0, Math.min(charLen - 1, charIndex));
                    const char = charList[clampedIndex];
                    this.ctx.fillStyle = this.options.textColor;
                    this.ctx.fillText(char, px, py);
                } 
                else if (this.options.renderMode === 'halftone') {
                    const maxRadius = Math.min(charWidth, charHeight) / 2;
                    // Darker = larger circle, or inverted based on user preference?
                    // Usually halftone dots get larger in dark areas if background is white.
                    // If invert is handled above, lum already reflects the adjusted brightness.
                    // For standard (dark mode default), we want bright = large dot, dark = small dot.
                    const radius = maxRadius * (lum / 255);
                    if (radius > 0.5) {
                        this.ctx.fillStyle = this.options.textColor;
                        this.ctx.beginPath();
                        this.ctx.arc(px + charWidth/2, py + charHeight/2, radius, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
                else if (this.options.renderMode === 'bitmap') {
                    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
                    this.ctx.fillRect(px, py, charWidth, charHeight);
                }
                else if (this.options.renderMode === 'posterize') {
                    // Quantize to 4 levels per channel
                    const levels = 4;
                    const step = 255 / (levels - 1);
                    const qR = Math.round(Math.round(r / step) * step);
                    const qG = Math.round(Math.round(g / step) * step);
                    const qB = Math.round(Math.round(b / step) * step);
                    this.ctx.fillStyle = `rgb(${qR},${qG},${qB})`;
                    this.ctx.fillRect(px, py, charWidth, charHeight);
                }
                else if (this.options.renderMode === 'tiles') {
                    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
                    const gap = 1;
                    this.ctx.fillRect(px + gap, py + gap, charWidth - gap*2, charHeight - gap*2);
                }
            }
        }
    }

    private calculateDimensions(source: HTMLImageElement | HTMLVideoElement) {
        let sourceWidth, sourceHeight;
        
        if (source instanceof HTMLVideoElement) {
            sourceWidth = source.videoWidth;
            sourceHeight = source.videoHeight;
        } else {
            sourceWidth = source.naturalWidth;
            sourceHeight = source.naturalHeight;
        }
        
        // We might want to limit max width to prevent lag
        const MAX_WIDTH = 1280;
        if (sourceWidth > MAX_WIDTH) {
            const ratio = MAX_WIDTH / sourceWidth;
            return {
                width: MAX_WIDTH,
                height: Math.floor(sourceHeight * ratio)
            };
        }
        
        return { width: sourceWidth, height: sourceHeight };
    }
}
