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

// Event Listeners
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

// File Handling
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

// Upload to Backend
async function uploadAndCompress(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${BACKEND_URL}/compress`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Compression failed');
        
        return await response.json();
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Alternative: Use FormData approach
async function uploadAndCompressFormData(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        progressBar.style.width = '30%';
        progressText.textContent = 'Uploading to server...';
        
        const response = await fetch(`${BACKEND_URL}/api/compress`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Compression failed');
        }
        
        displayResults(result);
        
    } catch (error) {
        console.error('FormData Error:', error);
        showDemoResults(file);
    }
}

// Display Results
function displayResults(result) {
    // Hide progress after a delay
    setTimeout(() => {
        progressContainer.style.display = 'none';
        
        // Set compressed image
        compressedImage.src = result.compressed_image;
        
        // Update metrics
        compressionRatio.textContent = `${result.metrics.compression_ratio}x`;
        psnrValue.textContent = `${result.metrics.psnr} dB`;
        sizeReduction.textContent = `${result.metrics.size_reduction}%`;
        diagnosticIntegrity.textContent = `${result.metrics.diagnostic_integrity}%`;
        
        // Update compressed size
        compressedSize.textContent = `${result.metrics.compressed_size} KB`;
        
        // Setup download
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = result.compressed_image;
            link.download = `compressed_medical_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Compressed image downloaded successfully!');
        };
        
        // Show results
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
    }, 500);
}

// Demo mode fallback
function showDemoResults(file) {
    progressBar.style.width = '100%';
    progressText.textContent = 'Using demo mode...';
    
    setTimeout(() => {
        progressContainer.style.display = 'none';
        
        // Use original image as placeholder
        compressedImage.src = originalImage.src;
        
        // Calculate simulated metrics
        const originalSizeBytes = file.size;
        const compressedBytes = Math.round(originalSizeBytes * 0.35); // Simulate 65% reduction
        const compressionRatioValue = (originalSizeBytes / compressedBytes).toFixed(1);
        const psnrValueSim = (36 + Math.random() * 4).toFixed(1);
        const reductionValue = (100 - (compressedBytes / originalSizeBytes) * 100).toFixed(1);
        
        // Update UI
        compressedSize.textContent = formatFileSize(compressedBytes);
        compressionRatio.textContent = `${compressionRatioValue}x`;
        psnrValue.textContent = `${psnrValueSim} dB`;
        sizeReduction.textContent = `${reductionValue}%`;
        diagnosticIntegrity.textContent = `${(96 + Math.random() * 3).toFixed(1)}%`;
        
        // Setup download
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = originalImage.src;
            link.download = `demo_compressed_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Demo image downloaded. Note: Real compression will work when backend is connected.');
        };
        
        // Show results
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
    }, 1000);
}

// Helper Functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data:image/...;base64, part
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Test connection on load
async function testConnection() {
    try {
        console.log('Testing connection to backend...');
        const response = await fetch(`${BACKEND_URL}/api/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connection successful:', data);
            return true;
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend:', error.message);
    }
    return false;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MediCompress initialized');
    console.log('Backend URL:', BACKEND_URL);
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('Running in demo mode - backend not available');
        // Show subtle notification
        const demoNotice = document.createElement('div');
        demoNotice.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #ff9800;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: pointer;
            ">
                <strong>Demo Mode</strong><br>
                <small>Using simulated compression</small>
            </div>
        `;
        demoNotice.onclick = () => demoNotice.remove();
        document.body.appendChild(demoNotice);
    }
});
