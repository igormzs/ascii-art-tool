import { AsciiProcessor, AsciiOptions } from './ascii-processor';

// DOM Elements
const dropzone = document.getElementById('upload-dropzone') as HTMLDivElement;
const fileInput = document.getElementById('input-file') as HTMLInputElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const outputCanvas = document.getElementById('output-canvas') as HTMLCanvasElement;
const exportControls = document.getElementById('export-controls') as HTMLDivElement;
const btnRecordVideo = document.getElementById('btn-record-video') as HTMLButtonElement;
const btnDownloadVideo = document.getElementById('btn-download-video') as HTMLButtonElement;
const textRecordStatus = document.getElementById('text-record-status') as HTMLSpanElement;
const recordingTime = document.getElementById('recording-time') as HTMLSpanElement;
const btnExportImage = document.getElementById('btn-export-image') as HTMLButtonElement;
const btnCopyAscii = document.getElementById('btn-copy-ascii') as HTMLButtonElement;
const btnCamera = document.getElementById('btn-camera') as HTMLDivElement;
const btnUploadTrigger = document.getElementById('btn-upload-trigger') as HTMLDivElement;
const textUseCamera = document.getElementById('text-use-camera') as HTMLSpanElement;
const videoExportSection = document.getElementById('video-export-section') as HTMLDivElement;

// App State
let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
let isVideo = false;
let isPlaying = false;
let animationFrameId: number;
let processor: AsciiProcessor | null = null;
let currentStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let isRecording = false;
let recordingStartTime: number = 0;
let recordingInterval: number | null = null;

// Event Listeners for Camera
btnCamera.addEventListener('click', (e) => {
    e.stopPropagation();
    handleCamera();
});

// Upload trigger listener
if (btnUploadTrigger) {
    btnUploadTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

if (textUseCamera) {
    textUseCamera.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCamera();
    });
}

// Logo Reset handler
const logo = document.querySelector('.logo') as HTMLDivElement;
logo.addEventListener('click', () => {
    cleanupMedia();
    mediaElement = null;
    dropzone.classList.remove('hidden');
    outputContainer.classList.add('hidden');
    outputContainer.classList.remove('flex');
    exportControls.classList.add('hidden');
    videoExportSection.classList.add('hidden');
    stopRecording();
});

// Recording Logic
btnRecordVideo.addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    recordedChunks = [];
    const stream = outputCanvas.captureStream(30);
    
    try {
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });
    } catch (e) {
        // Fallback for browsers that don't support vp9
        mediaRecorder = new MediaRecorder(stream);
    }
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        btnDownloadVideo.onclick = (e) => {
            e.stopPropagation();
            const a = document.createElement('a');
            a.href = url;
            a.download = `ascii-art-${Date.now()}.webm`;
            a.click();
        };
        videoExportSection.classList.remove('hidden');
    };
    
    mediaRecorder.start();
    isRecording = true;
    btnRecordVideo.classList.add('recording');
    textRecordStatus.textContent = 'Stop';
    
    // Start timer
    recordingStartTime = Date.now();
    recordingTime.classList.remove('hidden');
    recordingTime.textContent = '00:00';
    recordingInterval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        recordingTime.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        btnRecordVideo.classList.remove('recording');
        textRecordStatus.textContent = 'Record';
        
        // Stop timer
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        recordingTime.classList.add('hidden');
    }
}

// Default Options
let currentOptions: AsciiOptions = {
    chars: '@#S%?*+;:,.',
    fontFamily: "'Ubuntu Mono', monospace",
    fontWeight: '400',
    fontSize: 8,
    bgColor: '#000000',
    bgOpacity: 100,
    textColor: '#00ff41',
    textOpacity: 100,
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

let exportFormat: 'png' | 'jpeg' = 'png';

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
const sliderBgOpacityMain = document.getElementById('slider-bg-opacity-main') as HTMLInputElement;
const valBgOpacityMain = document.getElementById('val-bg-opacity-main') as HTMLSpanElement;
const sliderTextOpacity = document.getElementById('slider-text-opacity') as HTMLInputElement;
const valTextOpacity = document.getElementById('val-text-opacity') as HTMLSpanElement;
const btnDownloadTrigger = document.getElementById('btn-download-trigger') as HTMLButtonElement;
const downloadDropdown = document.getElementById('download-dropdown') as HTMLDivElement;
const dropdownItems = document.querySelectorAll('.dropdown-item');
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

sliderBgOpacityMain.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valBgOpacityMain.textContent = `${val}%`;
    updateOptions({ bgOpacity: val });
});

sliderTextOpacity.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    valTextOpacity.textContent = `${val}%`;
    updateOptions({ textOpacity: val });
});

// Download Dropdown Logic
btnDownloadTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    downloadDropdown.classList.add('hidden');
});

dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const format = (e.currentTarget as HTMLButtonElement).getAttribute('data-format') as 'png' | 'jpeg';
        if (format) {
            exportImage(format);
        }
        downloadDropdown.classList.add('hidden');
    });
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

function cleanupMedia() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (mediaElement && isVideo) {
        (mediaElement as HTMLVideoElement).pause();
    }
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    videoExportSection.classList.add('hidden');
}

async function handleCamera() {
    console.log("Requesting camera access...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        cleanupMedia();
        currentStream = stream;
        
        isVideo = true;
        
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            console.log("Camera metadata loaded", video.videoWidth, video.videoHeight);
            mediaElement = video;
            initProcessor();
            video.play().then(() => {
                console.log("Camera playback started");
                isPlaying = true;
                renderLoop();
                
                // Show UI
                dropzone.classList.add('hidden');
                outputContainer.classList.remove('hidden');
                outputContainer.classList.add('flex');
                exportControls.classList.remove('hidden');
            }).catch(err => {
                console.error("Video play error:", err);
            });
        };
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Camera access was denied or is not available. Please check your browser permissions.");
    }
}

function handleFile(file: File) {
    console.log("Handling file:", file.name, file.type);
    const url = URL.createObjectURL(file);
    
    cleanupMedia();
    
    isVideo = false;
    videoExportSection.classList.add('hidden');
    
    if (file.type.startsWith('video/')) {
        isVideo = true;
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
        animationFrameId = requestAnimationFrame(renderLoop);
    }
}


// Image Export
function exportImage(format: 'png' | 'jpeg') {
    if (!outputCanvas) return;
    const link = document.createElement('a');
    const extension = format === 'png' ? 'png' : 'jpg';
    link.download = `ascii-art-${Date.now()}.${extension}`;
    
    if (format === 'png') {
        link.href = outputCanvas.toDataURL('image/png');
    } else {
        link.href = outputCanvas.toDataURL('image/jpeg', 0.9);
    }
    link.click();
}

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
