import { AsciiProcessor, AsciiOptions } from './ascii-processor';

// DOM Elements
const dropzone = document.getElementById('upload-dropzone') as HTMLDivElement;
const fileInput = document.getElementById('input-file') as HTMLInputElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const outputCanvas = document.getElementById('output-canvas') as HTMLCanvasElement;
const dropzoneContent = document.getElementById('dropzone-content') as HTMLDivElement;
const exportControls = document.getElementById('export-controls') as HTMLDivElement;
const btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnExportSidebar = document.getElementById('btn-export-video-sidebar') as HTMLButtonElement;
const btnExportImage = document.getElementById('btn-export-image') as HTMLButtonElement;
const btnCopyAscii = document.getElementById('btn-copy-ascii') as HTMLButtonElement;
const videoExportSection = document.getElementById('video-export-section') as HTMLDivElement;

// Settings panels are now individual <details> elements — no global toggle needed.

// App State
let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
let isVideo = false;
let isPlaying = false;
let animationFrameId: number;
let processor: AsciiProcessor | null = null;

// Default Options
let currentOptions: AsciiOptions = {
    chars: '@#S%?*+;:,.',
    fontFamily: "'Ubuntu Mono', monospace",
    fontWeight: '400',
    fontSize: 8,
    bgColor: '#000000',
    textColor: '#00ff41',
    brightness: 100,
    contrast: 100,
    gamma: 1.0,
    invert: false,
    originalBackground: false,
    customBgImage: null,
    customBgOpacity: 100,
    customBgBw: false,
    renderMode: 'ascii'
};

// UI Bindings
const inputChars = document.getElementById('input-chars') as HTMLTextAreaElement;
const inputFont = document.getElementById('input-font') as HTMLSelectElement;
const inputWeight = document.getElementById('input-weight') as HTMLSelectElement;
const colorBg = document.getElementById('color-bg') as HTMLInputElement;
const colorBgText = document.getElementById('color-bg-text') as HTMLInputElement;
const colorText = document.getElementById('color-text') as HTMLInputElement;
const colorTextText = document.getElementById('color-text-text') as HTMLInputElement;
const btnSwapColors = document.getElementById('btn-swap-colors') as HTMLButtonElement;
const themeBtns = document.querySelectorAll('.theme-btn');
const sliderFontSize = document.getElementById('slider-font-size') as HTMLInputElement;
const valFontSize = document.getElementById('val-font-size') as HTMLSpanElement;
const sliderBrightness = document.getElementById('slider-brightness') as HTMLInputElement;
const valBrightness = document.getElementById('val-brightness') as HTMLSpanElement;
const sliderContrast = document.getElementById('slider-contrast') as HTMLInputElement;
const valContrast = document.getElementById('val-contrast') as HTMLSpanElement;
const sliderGamma = document.getElementById('slider-gamma') as HTMLInputElement;
const valGamma = document.getElementById('val-gamma') as HTMLSpanElement;
const toggleInvert = document.getElementById('toggle-invert') as HTMLInputElement;
const toggleOriginalBg = document.getElementById('toggle-original-bg') as HTMLInputElement;
const btnCustomBg = document.getElementById('btn-custom-bg') as HTMLButtonElement;
const inputCustomBg = document.getElementById('input-custom-bg') as HTMLInputElement;
const btnClearBg = document.getElementById('btn-clear-bg') as HTMLButtonElement;
const customBgControls = document.getElementById('custom-bg-controls') as HTMLDivElement;
const sliderBgOpacity = document.getElementById('slider-bg-opacity') as HTMLInputElement;
const valBgOpacity = document.getElementById('val-bg-opacity') as HTMLSpanElement;
const toggleBgBw = document.getElementById('toggle-bg-bw') as HTMLInputElement;
const resetBtns = document.querySelectorAll('.btn-reset');
const modeBtns = document.querySelectorAll('.mode-btn');

function updateOptions(updates: Partial<AsciiOptions>) {
    currentOptions = { ...currentOptions, ...updates };

    if (processor && mediaElement) {
        processor.setOptions(currentOptions);
        if (!isVideo || !isPlaying) {
            processor.processFrame(mediaElement);
        }
    }
}

// Event Listeners for UI
inputChars.addEventListener('input', (e) => updateOptions({ chars: (e.target as HTMLTextAreaElement).value }));
inputFont.addEventListener('change', (e) => updateOptions({ fontFamily: (e.target as HTMLSelectElement).value }));
inputWeight.addEventListener('change', (e) => updateOptions({ fontWeight: (e.target as HTMLSelectElement).value }));

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        modeBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked
        btn.classList.add('active');
        // Update options
        const mode = btn.getAttribute('data-mode') as 'ascii' | 'halftone' | 'bitmap' | 'posterize' | 'tiles';
        if (mode) {
            updateOptions({ renderMode: mode });
        }
    });
});

function handleColorChange(type: 'bg' | 'text', value: string) {
    if (type === 'bg') {
        colorBg.value = value;
        colorBgText.value = value;
        updateOptions({ bgColor: value });
    } else {
        colorText.value = value;
        colorTextText.value = value;
        updateOptions({ textColor: value });
    }
}

colorBg.addEventListener('input', (e) => handleColorChange('bg', (e.target as HTMLInputElement).value));
colorBgText.addEventListener('input', (e) => handleColorChange('bg', (e.target as HTMLInputElement).value));
colorText.addEventListener('input', (e) => handleColorChange('text', (e.target as HTMLInputElement).value));
colorTextText.addEventListener('input', (e) => handleColorChange('text', (e.target as HTMLInputElement).value));

btnSwapColors.addEventListener('click', () => {
    const temp = currentOptions.bgColor;
    handleColorChange('bg', currentOptions.textColor);
    handleColorChange('text', temp);
});

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-bg');
        const text = btn.getAttribute('data-text');
        if (bg && text) {
            handleColorChange('bg', bg);
            handleColorChange('text', text);
        }
    });
});

sliderFontSize.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valFontSize.textContent = `${val}px`;
    updateOptions({ fontSize: val });
});

sliderBrightness.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valBrightness.textContent = `${val}%`;
    updateOptions({ brightness: val });
});

sliderContrast.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valContrast.textContent = `${val}%`;
    // Map contrast slider 0-300 to -128 to 128 for the processor
    updateOptions({ contrast: (val - 100) * 1.28 });
});

sliderGamma.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    valGamma.textContent = val.toFixed(1);
    updateOptions({ gamma: val });
});

toggleInvert.addEventListener('change', (e) => updateOptions({ invert: (e.target as HTMLInputElement).checked }));
toggleOriginalBg.addEventListener('change', (e) => updateOptions({ originalBackground: (e.target as HTMLInputElement).checked }));

btnCustomBg.addEventListener('click', () => {
    inputCustomBg.click();
});

inputCustomBg.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            updateOptions({ customBgImage: img });
            btnClearBg.classList.remove('hidden');
            customBgControls.classList.remove('hidden');
        };
    }
});

btnClearBg.addEventListener('click', () => {
    updateOptions({ customBgImage: null });
    inputCustomBg.value = '';
    btnClearBg.classList.add('hidden');
    customBgControls.classList.add('hidden');
});

sliderBgOpacity.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valBgOpacity.textContent = `${val}%`;
    updateOptions({ customBgOpacity: val });
});

toggleBgBw.addEventListener('change', (e) => updateOptions({ customBgBw: (e.target as HTMLInputElement).checked }));

resetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = (e.target as HTMLElement).getAttribute('data-target');
        const defVal = (e.target as HTMLElement).getAttribute('data-default');
        if (targetId && defVal) {
            const input = document.getElementById(targetId) as HTMLInputElement;
            input.value = defVal;
            input.dispatchEvent(new Event('input'));
        }
    });
});

// File Handling
dropzone.addEventListener('click', () => {
    fileInput.click();
});

outputContainer.addEventListener('click', () => {
    fileInput.click();
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
});

dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
        fileInput.value = ''; // Reset to allow selecting the same file again
    }
});

function handleFile(file: File) {
    console.log("Handling file:", file.name, file.type);
    const url = URL.createObjectURL(file);
    
    // Cleanup previous
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (mediaElement && isVideo) {
        (mediaElement as HTMLVideoElement).pause();
    }
    
    isVideo = false;
    videoExportSection.classList.add('hidden');
    
    if (file.type.startsWith('video/')) {
        isVideo = true;
        videoExportSection.classList.remove('hidden');
        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        
        video.addEventListener('loadeddata', () => {
            mediaElement = video;
            initProcessor();
            video.play();
            isPlaying = true;
            renderLoop();
            
            // Show UI
            dropzone.classList.add('hidden');
            outputContainer.classList.remove('hidden');
            outputContainer.classList.add('flex');
            exportControls.classList.remove('hidden');
            
            updateTimeDisplay();
        });
    } else {
        // Treat as image
        isVideo = false;
        const img = new Image();
        img.src = url;
        img.onload = () => {
            console.log("Image loaded successfully");
            mediaElement = img;
            initProcessor();
            try {
                processor!.processFrame(img);
                console.log("Frame processed successfully");
            } catch (err) {
                console.error("Error processing frame:", err);
                alert("Error processing image: " + err);
            }
            
            // Show UI
            dropzone.classList.add('hidden');
            outputContainer.classList.remove('hidden');
            outputContainer.classList.add('flex');
            exportControls.classList.add('hidden'); // No export for images for now
        };
        img.onerror = () => {
            console.error("Failed to load image from file");
            alert("Could not load the file as an image.");
        };
    }
}

function initProcessor() {
    if (!processor) {
        processor = new AsciiProcessor(outputCanvas, currentOptions);
    }
}

function renderLoop() {
    if (isVideo && isPlaying && mediaElement && processor) {
        processor.processFrame(mediaElement);
        updateTimeDisplay();
        animationFrameId = requestAnimationFrame(renderLoop);
    }
}

function updateTimeDisplay() {
    if (isVideo && mediaElement) {
        const vid = mediaElement as HTMLVideoElement;
        const format = (t: number) => {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };
        timeDisplay.textContent = `${format(vid.currentTime)} / ${format(vid.duration || 0)}`;
    }
}

btnPlayPause.addEventListener('click', () => {
    if (isVideo && mediaElement) {
        const vid = mediaElement as HTMLVideoElement;
        if (isPlaying) {
            vid.pause();
            isPlaying = false;
            btnPlayPause.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            cancelAnimationFrame(animationFrameId);
        } else {
            vid.play();
            isPlaying = true;
            btnPlayPause.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
            renderLoop();
        }
    }
});

// Video Export Logic
btnExport.addEventListener('click', startVideoExport);
btnExportSidebar.addEventListener('click', startVideoExport);

btnExportImage.addEventListener('click', () => {
    if (!outputCanvas) return;
    const link = document.createElement('a');
    link.download = `ascii-art-${Date.now()}.png`;
    link.href = outputCanvas.toDataURL('image/png');
    link.click();
});

btnCopyAscii.addEventListener('click', () => {
    if (!processor || !mediaElement) return;
    const text = processor.getAsciiString(mediaElement);
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btnCopyAscii.textContent;
        btnCopyAscii.textContent = "Copied!";
        btnCopyAscii.classList.add('btn-success');
        setTimeout(() => {
            btnCopyAscii.textContent = originalText;
            btnCopyAscii.classList.remove('btn-success');
        }, 2000);
    });
});

async function startVideoExport() {
    if (!isVideo || !mediaElement) return;
    
    const vid = mediaElement as HTMLVideoElement;
    const stream = outputCanvas.captureStream(30); // 30 fps
    
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
    }
    
    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ascii-export-${Date.now()}.webm`;
        a.click();
        
        btnExport.textContent = 'Export Video';
        btnExport.disabled = false;
        
        // Restore loop
        vid.loop = true;
        vid.play();
        isPlaying = true;
        renderLoop();
    };

    // Pause normal playback to record
    cancelAnimationFrame(animationFrameId);
    vid.pause();
    
    btnExport.textContent = 'Exporting...';
    btnExport.disabled = true;
    
    // Start recording from beginning
    vid.currentTime = 0;
    vid.loop = false; // Stop at end
    
    await new Promise(resolve => setTimeout(resolve, 500)); // wait for seek
    
    vid.play();
    mediaRecorder.start();
    
    const exportLoop = () => {
        processor!.processFrame(vid);
        if (!vid.ended) {
            requestAnimationFrame(exportLoop);
        } else {
            mediaRecorder.stop();
        }
    };
    
    exportLoop();
}
