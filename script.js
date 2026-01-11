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
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        // Show progress
        progressBar.style.width = '30%';
        progressText.textContent = 'Uploading to server...';
        
        // Try multiple endpoints - Hugging Face Spaces can be tricky
        const endpoints = [
            `${BACKEND_URL}/api/compress`,
            `${BACKEND_URL}/api/predict`,
            `${BACKEND_URL}/run/predict`
        ];
        
        let response;
        let lastError;
        
        // Try each endpoint
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // Some Hugging Face spaces need this
                        'Accept': 'application/json',
                    },
                    mode: 'cors' // Explicitly enable CORS
                });
                
                if (response.ok) {
                    console.log(`Success with endpoint: ${endpoint}`);
                    break;
                } else {
                    lastError = `HTTP ${response.status}: ${response.statusText}`;
                }
            } catch (err) {
                lastError = err.message;
                console.log(`Endpoint ${endpoint} failed:`, err);
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`All endpoints failed. Last error: ${lastError}`);
        }
        
        progressBar.style.width = '70%';
        progressText.textContent = 'Processing with AI model...';
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Compression failed');
        }
        
        progressBar.style.width = '90%';
        progressText.textContent = 'Finalizing results...';
        
        // Add a small delay for smooth progress bar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        progressBar.style.width = '100%';
        progressText.textContent = 'Complete!';
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('Error:', error);
        
        // Fallback to demo mode if API fails
        alert(`API Error: ${error.message}. Using demo mode with simulated results.`);
        
        // Show demo results
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
        
        // Update sizes
        const originalSizeBytes = getFileSizeFromText(originalSize.textContent);
        const compressedSizeKB = parseFloat(result.metrics.compressed_size);
        compressedSize.textContent = `${compressedSizeKB.toFixed(1)} KB`;
        
        // Setup download
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = result.compressed_image;
            link.download = `compressed_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
        const compressedBytes = Math.round(originalSizeBytes * 0.3); // Simulate 70% reduction
        const compressionRatioValue = (originalSizeBytes / compressedBytes).toFixed(1);
        const psnrValueSim = (35 + Math.random() * 5).toFixed(1);
        const reductionValue = (100 - (compressedBytes / originalSizeBytes) * 100).toFixed(1);
        
        // Update UI
        compressedSize.textContent = formatFileSize(compressedBytes);
        compressionRatio.textContent = `${compressionRatioValue}x`;
        psnrValue.textContent = `${psnrValueSim} dB`;
        sizeReduction.textContent = `${reductionValue}%`;
        diagnosticIntegrity.textContent = `${(95 + Math.random() * 4).toFixed(1)}%`;
        
        // Setup download
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = originalImage.src; // In demo, download original
            link.download = `demo_compressed_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        // Show results
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Show demo notice
        alert('Note: Currently in demo mode. The backend API is not responding. Real compression will work when the Hugging Face Space is properly configured.');
    }, 1000);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileSizeFromText(text) {
    const num = parseFloat(text);
    if (text.includes('KB')) return num * 1024;
    if (text.includes('MB')) return num * 1024 * 1024;
    return num;
}

// Test connection on load
async function testConnection() {
    try {
        console.log('Testing connection to backend...');
        const response = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Backend connection successful:', data);
            return true;
        } else {
            console.log('Backend health check failed');
            return false;
        }
    } catch (error) {
        console.log('Cannot connect to backend:', error.message);
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MediCompress initialized');
    console.log('Backend URL:', BACKEND_URL);
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('Running in offline/demo mode');
        // You could show a subtle notification to users
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff9800;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        `;
        statusIndicator.textContent = 'Demo Mode';
        statusIndicator.title = 'Backend connection not available. Using demo mode.';
        document.body.appendChild(statusIndicator);
    }
});
