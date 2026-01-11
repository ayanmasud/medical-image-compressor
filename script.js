// Configuration
const BACKEND_URL = "YOUR_HUGGING_FACE_SPACE_URL"; // Update this later

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
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading image...';
        
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
        // Update progress
        progressBar.style.width = '30%';
        progressText.textContent = 'Sending to compression server...';
        
        // For now, simulate API call
        // Replace with actual fetch when backend is ready
        /*
        const response = await fetch(`${BACKEND_URL}/compress`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Compression failed');
        }
        
        const result = await response.json();
        */
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        progressBar.style.width = '60%';
        progressText.textContent = 'Processing with AI model...';
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        progressBar.style.width = '100%';
        progressText.textContent = 'Finalizing results...';
        
        // For demo - simulate results
        const simulatedResult = {
            compressed_image: originalImage.src, // In real app, this would be the compressed image URL
            metrics: {
                compression_ratio: (Math.random() * 15 + 8).toFixed(1),
                psnr: (Math.random() * 10 + 35).toFixed(1),
                size_reduction: (Math.random() * 30 + 60).toFixed(1),
                diagnostic_integrity: (Math.random() * 5 + 95).toFixed(1)
            }
        };
        
        // Display results
        displayResults(simulatedResult);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Compression failed. Please try again.');
        progressContainer.style.display = 'none';
    }
}

// Display Results
function displayResults(result) {
    // Hide progress
    progressContainer.style.display = 'none';
    
    // Set compressed image (in real app, this would be from result.compressed_image)
    compressedImage.src = originalImage.src; // Demo only
    
    // Calculate compressed size (demo: 25% of original)
    const originalSizeBytes = getFileSizeFromText(originalSize.textContent);
    const compressedBytes = Math.round(originalSizeBytes * 0.25);
    compressedSize.textContent = formatFileSize(compressedBytes);
    
    // Update metrics
    compressionRatio.textContent = `${result.metrics.compression_ratio}x`;
    psnrValue.textContent = `${result.metrics.psnr} dB`;
    sizeReduction.textContent = `${result.metrics.size_reduction}%`;
    diagnosticIntegrity.textContent = `${result.metrics.diagnostic_integrity}%`;
    
    // Setup download
    downloadBtn.onclick = () => downloadCompressedImage();
    
    // Show results
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
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

function downloadCompressedImage() {
    // In real app, download the actual compressed image
    const link = document.createElement('a');
    link.href = compressedImage.src;
    link.download = 'compressed_medical_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert('Compressed image downloaded successfully!');
}

// Initialize
console.log('MediCompress initialized');
console.log('Backend URL:', BACKEND_URL);