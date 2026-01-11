// Configuration
const BACKEND_URL = "https://ayanmasud-medical-image-compressor-backend.hf.space";

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsContainer = document.getElementById('resultsContainer');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const compressionRatio = document.getElementById('compressionRatio');
const psnrValue = document.getElementById('psnrValue');
const sizeReduction = document.getElementById('sizeReduction');
const diagnosticIntegrity = document.getElementById('diagnosticIntegrity');
const downloadBtn = document.getElementById('downloadBtn');

// State
let currentCompressedImageData = null;

// ============================================================================
// EVENT LISTENERS
// ============================================================================

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

// ============================================================================
// FILE HANDLING
// ============================================================================

function handleFile(file) {
    // Validate file
    if (!file.type.match('image.*')) {
        alert('Please select an image file (PNG, JPG, JPEG)');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    // Display original image
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalSize.textContent = formatFileSize(file.size);
        
        // Show progress
        progressContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        progressBar.style.width = '10%';
        progressText.textContent = 'Preparing image...';
        
        // Upload and compress
        uploadAndCompress(file);
    };
    reader.readAsDataURL(file);
}

// ============================================================================
// API CALLS
// ============================================================================

async function uploadAndCompress(file) {
    try {
        progressBar.style.width = '30%';
        progressText.textContent = 'Uploading to server...';
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('📤 Sending to:', `${BACKEND_URL}/compress`);
        
        // Try main endpoint
        const response = await fetch(`${BACKEND_URL}/compress`, {
            method: 'POST',
            body: formData,
            // Important: Let browser set Content-Type for FormData
            headers: {
                'Accept': 'application/json',
            },
            mode: 'cors'
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        progressBar.style.width = '70%';
        progressText.textContent = 'Processing with AI...';
        
        const result = await response.json();
        console.log('✅ API response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Compression failed');
        }
        
        progressBar.style.width = '100%';
        progressText.textContent = 'Complete!';
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('❌ Compression error:', error);
        
        // Try alternative endpoint
        try {
            console.log('🔄 Trying alternative endpoint...');
            progressBar.style.width = '50%';
            progressText.textContent = 'Trying alternative connection...';
            
            const alternativeResult = await tryAlternativeEndpoint(file);
            displayResults(alternativeResult);
            
        } catch (altError) {
            console.error('❌ All endpoints failed:', altError);
            
            // Fallback to demo mode
            progressText.textContent = 'Using demo mode...';
            setTimeout(() => {
                showDemoResults(file);
            }, 1000);
        }
    }
}

async function tryAlternativeEndpoint(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BACKEND_URL}/api/compress`, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
        },
        mode: 'cors'
    });
    
    if (!response.ok) {
        throw new Error(`Alternative endpoint failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error || 'Compression failed');
    }
    
    return result;
}

// ============================================================================
// RESULTS DISPLAY
// ============================================================================

function displayResults(result) {
    // Hide progress after delay
    setTimeout(() => {
        progressContainer.style.display = 'none';
        
        // Store compressed image data
        currentCompressedImageData = result.compressed_image;
        
        // Set compressed image
        compressedImage.src = result.compressed_image;
        compressedImage.onload = () => {
            console.log('✅ Compressed image loaded');
        };
        
        // Update metrics
        compressionRatio.textContent = `${result.metrics.compression_ratio}x`;
        psnrValue.textContent = `${result.metrics.psnr} dB`;
        sizeReduction.textContent = `${result.metrics.size_reduction}%`;
        diagnosticIntegrity.textContent = `${result.metrics.diagnostic_integrity}%`;
        compressedSize.textContent = `${result.metrics.compressed_size} KB`;
        
        // Setup download
        setupDownload(result.compressed_image);
        
        // Show results with animation
        resultsContainer.style.display = 'block';
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
        
        // Show success notification
        showNotification('✅ Image compressed successfully!', 'success');
        
    }, 500);
}

function showDemoResults(file) {
    progressContainer.style.display = 'none';
    
    // Use original as placeholder
    compressedImage.src = originalImage.src;
    
    // Calculate simulated metrics
    const originalSizeBytes = file.size;
    const compressedBytes = Math.round(originalSizeBytes * 0.35);
    const compressionRatioValue = (originalSizeBytes / compressedBytes).toFixed(1);
    const psnrValueSim = (36 + Math.random() * 4).toFixed(1);
    const reductionValue = (100 - (compressedBytes / originalSizeBytes) * 100).toFixed(1);
    
    // Update UI
    compressedSize.textContent = formatFileSize(compressedBytes);
    compressionRatio.textContent = `${compressionRatioValue}x`;
    psnrValue.textContent = `${psnrValueSim} dB`;
    sizeReduction.textContent = `${reductionValue}%`;
    diagnosticIntegrity.textContent = `${(96 + Math.random() * 3).toFixed(1)}%`;
    
    // Setup demo download
    setupDownload(originalImage.src, true);
    
    // Show results
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Show demo notification
    showNotification('⚠️ Using demo mode. Backend not available.', 'warning');
}

// ============================================================================
// DOWNLOAD FUNCTIONALITY
// ============================================================================

function setupDownload(imageData, isDemo = false) {
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = imageData;
        
        if (isDemo) {
            link.download = `demo_compressed_${Date.now()}.png`;
            alert('Demo image downloaded. Note: Real compression requires backend connection.');
        } else {
            link.download = `compressed_medical_image_${Date.now()}.png`;
            alert('✅ Compressed image downloaded successfully!');
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        ">
            <span style="font-size: 20px;">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
                padding: 0 5px;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ============================================================================
// CONNECTION TESTING
// ============================================================================

async function testConnection() {
    console.log('🔗 Testing backend connection...');
    
    const endpoints = [
        `${BACKEND_URL}/health`,
        `${BACKEND_URL}/api/health`,
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Connected to ${endpoint}:`, data);
                return true;
            }
        } catch (error) {
            console.log(`❌ Failed to connect to ${endpoint}:`, error.message);
        }
    }
    
    console.log('❌ All connection attempts failed');
    return false;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize() {
    console.log('🚀 Medical Image Compressor Initializing...');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Frontend URL:', window.location.origin);
    
    // Test connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
        showNotification('⚠️ Backend not available. Using demo mode.', 'warning');
        
        // Add demo indicator
        const demoIndicator = document.createElement('div');
        demoIndicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #FF9800;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>⚠️</span>
                <div>
                    <strong>Demo Mode</strong><br>
                    <small>Backend offline</small>
                </div>
            </div>
        `;
        demoIndicator.onclick = () => demoIndicator.remove();
        document.body.appendChild(demoIndicator);
    } else {
        showNotification('✅ Connected to compression server', 'success');
    }
    
    // Add CSS for notification animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
        }
        
        .notification.removing {
            animation: slideOut 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Medical Image Compressor Ready');
}

// ============================================================================
// DEBUG HELPER
// ============================================================================

// Add this to test the API directly from browser console
window.testAPI = async function() {
    console.log('🧪 Testing API directly...');
    
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple medical-like image
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#1a73e8';
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // Convert to blob
    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'test.png');
            
            try {
                const response = await fetch(`${BACKEND_URL}/compress`, {
                    method: 'POST',
                    body: formData
                });
                
                console.log('Test response status:', response.status);
                const result = await response.json();
                console.log('Test result:', result);
                resolve(result);
            } catch (error) {
                console.error('Test failed:', error);
                resolve(null);
            }
        });
    });
};

// ============================================================================
// START THE APPLICATION
// ============================================================================

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
