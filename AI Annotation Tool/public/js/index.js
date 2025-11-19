/// Main application JavaScript for the AI Dataset Annotation Tool
/// This file handles all frontend interactions, AJAX calls to the backend API,
/// and dynamic DOM manipulation to create a responsive user interface

// API base URL for all backend requests
const apiBaseUrl = 'http://localhost:3000/API';
const sqliteEndpoint = 'http://localhost:3000/SQLite/Images';

// Global state to track currently loaded images
let currentImages = [];

/// Initialises the application when the DOM is fully loaded
/// Sets up all event listeners and loads initial data from the server
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialised');
    initialiseEventListeners();
    loadStatistics();
    loadImages();
    checkDatabaseConnection();
});

/// Sets up all event listeners for user interactions
/// This centralises event handling for better code organisation
function initialiseEventListeners() {
    // File input change event to show preview
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', handleImageSelection);

    // Upload form submission
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', handleImageUpload);

    // Refresh button to reload images
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        loadImages();
        loadStatistics();
    });

    // Modal controls for adding labels
    const closeModal = document.getElementById('closeModal');
    const cancelButton = document.getElementById('cancelButton');
    closeModal.addEventListener('click', hideModal);
    cancelButton.addEventListener('click', hideModal);

    // Label form submission
    const labelForm = document.getElementById('labelForm');
    labelForm.addEventListener('submit', handleLabelSubmission);

    // Close modal when clicking outside of it
    const modal = document.getElementById('labelModal');
    modal.addEventListener('click', (event) => {
        if (event.target === modal) hideModal();
    });
}

/// Handles the selection of an image file from the file input
/// Displays a preview of the selected image before upload
function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('File size exceeds 5MB limit', 'error');
        event.target.value = '';
        return;
    }

    // Create a URL for the selected file to display as preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewContainer = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        const previewFileName = document.getElementById('previewFileName');

        previewImage.src = e.target.result;
        previewFileName.textContent = file.name;
        previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

/// Handles the upload of a selected image to the server
/// Uses FormData to send the file as multipart/form-data
async function handleImageUpload(event) {
    event.preventDefault();

    const imageInput = document.getElementById('imageInput');
    const file = imageInput.files[0];

    if (!file) {
        showToast('Please select an image to upload', 'error');
        return;
    }

    // Create FormData object to send file data
    const formData = new FormData();
    formData.append('image', file);

    const uploadButton = document.getElementById('uploadButton');
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
        console.log(`Uploading image: ${file.name}`);

        // Send POST request with the file
        const response = await fetch(`${apiBaseUrl}/images`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Upload successful:', data);
            showToast('Image uploaded successfully!', 'success');

            // Reset form and reload images
            imageInput.value = '';
            document.getElementById('imagePreview').classList.add('hidden');
            loadImages();
            loadStatistics();
        } else {
            console.error('Upload failed:', data);
            showToast(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Network error during upload', 'error');
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Image';
    }
}

/// Loads all images from the server and displays them in the gallery
/// This function fetches image data and dynamically creates DOM elements
async function loadImages() {
    try {
        console.log('Fetching images from server...');

        const response = await fetch(`${apiBaseUrl}/images`);
        const data = await response.json();

        if (response.ok) {
            console.log(`Loaded ${data.count} images`);
            currentImages = data.data;
            renderImagesGrid(data.data);
        } else {
            console.error('Failed to load images:', data);
            showToast('Failed to load images', 'error');
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showToast('Network error loading images', 'error');
    }
}

/// Renders the images grid by creating DOM elements for each image
/// Shows empty state if no images are available
function renderImagesGrid(images) {
    const grid = document.getElementById('imagesGrid');
    const emptyState = document.getElementById('emptyState');

    // Clear existing content
    grid.innerHTML = '';

    if (images.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Create a card for each image
    images.forEach(image => {
        const card = createImageCard(image);
        grid.appendChild(card);
    });
}

/// Creates a DOM element card for a single image
/// Includes image preview, labels, and action buttons
function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';

    // Format file size for display
    const fileSizeKb = (image.file_size / 1024).toFixed(2);

    // Create labels HTML - image.labels is already an array of strings from the API
    const labelsHtml = image.labels.map(labelName =>
        `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
            ${labelName}
        </span>`
    ).join('');

    card.innerHTML = `
        <img src="${image.file_path}" alt="${image.original_name}" class="w-full h-48 object-cover" />
        <div class="p-4">
            <h3 class="font-semibold text-gray-900 truncate mb-2">${image.original_name}</h3>
            <p class="text-sm text-gray-600 mb-3">${fileSizeKb} KB • ${new Date(image.uploaded_at).toLocaleDateString()}</p>
            
            <div class="mb-3 min-h-[2rem]">
                ${labelsHtml || '<span class="text-sm text-gray-400 italic">No labels yet</span>'}
            </div>
            
            <div class="flex space-x-2">
                <button onclick="showLabelModal(${image.image_id})" class="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition-colors">
                    Add Label
                </button>
                <button onclick="deleteImage(${image.image_id})" class="flex-1 bg-red-500 text-white text-sm py-2 px-3 rounded hover:bg-red-600 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

/// Displays the modal dialog for adding a label to an image
/// Stores the image ID in a hidden field for later use
function showLabelModal(imageId) {
    const modal = document.getElementById('labelModal');
    const imageIdInput = document.getElementById('modalImageId');

    imageIdInput.value = imageId;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Focus on the label input for better UX
    document.getElementById('labelInput').focus();
}

/// Hides the label modal and resets the form
function hideModal() {
    const modal = document.getElementById('labelModal');
    const labelForm = document.getElementById('labelForm');

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    labelForm.reset();
}

/// Handles the submission of the label form
/// Sends a POST request to add the label to the image
async function handleLabelSubmission(event) {
    event.preventDefault();

    const imageId = document.getElementById('modalImageId').value;
    const labelName = document.getElementById('labelInput').value.trim();
    const confidence = parseFloat(document.getElementById('confidenceInput').value);

    if (!labelName) {
        showToast('Please enter a label name', 'error');
        return;
    }

    try {
        console.log(`Adding label "${labelName}" to image ${imageId}`);

        const response = await fetch(`${apiBaseUrl}/images/${imageId}/labels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                labelName: labelName,
                confidence: confidence
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Label added successfully:', data);
            showToast('Label added successfully!', 'success');
            hideModal();
            loadImages();
            loadStatistics();
        } else {
            console.error('Failed to add label:', data);
            showToast(data.error || 'Failed to add label', 'error');
        }
    } catch (error) {
        console.error('Error adding label:', error);
        showToast('Network error adding label', 'error');
    }
}

/// Removes a label from an image
/// This is called when the user clicks the × button on a label
async function removeLabel(imageId, labelId) {
    if (!confirm('Are you sure you want to remove this label?')) return;

    try {
        console.log(`Removing label ${labelId} from image ${imageId}`);

        const response = await fetch(`${apiBaseUrl}/images/${imageId}/labels/${labelId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Label removed successfully');
            showToast('Label removed successfully!', 'success');
            loadImages();
            loadStatistics();
        } else {
            const data = await response.json();
            console.error('Failed to remove label:', data);
            showToast(data.error || 'Failed to remove label', 'error');
        }
    } catch (error) {
        console.error('Error removing label:', error);
        showToast('Network error removing label', 'error');
    }
}

/// Deletes an image and all its associated labels
/// Prompts for confirmation before deletion
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;

    try {
        console.log(`Deleting image ${imageId}`);

        const response = await fetch(`${apiBaseUrl}/images/${imageId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Image deleted successfully');
            showToast('Image deleted successfully!', 'success');
            loadImages();
            loadStatistics();
        } else {
            const data = await response.json();
            console.error('Failed to delete image:', data);
            showToast(data.error || 'Failed to delete image', 'error');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        showToast('Network error deleting image', 'error');
    }
}

/// Loads statistics from the SQLite database endpoint
/// Updates the statistics cards at the top of the page
async function loadStatistics() {
    try {
        console.log('Fetching database statistics...');

        const response = await fetch(sqliteEndpoint);
        const data = await response.json();

        if (response.ok) {
            console.log('Statistics loaded:', data.statistics);

            document.getElementById('totalImages').textContent = data.statistics.totalImages;
            document.getElementById('totalLabels').textContent = data.statistics.totalLabels;
            document.getElementById('totalAnnotations').textContent = data.statistics.totalAnnotations;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/// Checks the database connection status
/// Updates the connection status indicator in the header
async function checkDatabaseConnection() {
    try {
        const response = await fetch(sqliteEndpoint);
        const data = await response.json();

        const statusElement = document.getElementById('connectionStatus');
        if (response.ok && data.status === 'connected') {
            statusElement.innerHTML = `
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-green-600">Connected</span>
      `;
            console.log('Database connection verified:', data);
        } else {
            statusElement.innerHTML = `
        <div class="w-2 h-2 bg-red-500 rounded-full"></div>
        <span class="text-sm font-medium text-red-600">Disconnected</span>
      `;
        }
    } catch (error) {
        console.error('Database connection check failed:', error);
        const statusElement = document.getElementById('connectionStatus');
        statusElement.innerHTML = `
      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
      <span class="text-sm font-medium text-red-600">Error</span>
    `;
    }
}

/// Displays a toast notification message
/// Used for user feedback on actions (success, error, info)
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Set message text
    toastMessage.textContent = message;

    // Set colour based on type
    if (type === 'success') {
        toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50';
    } else if (type === 'error') {
        toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50';
    } else {
        toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50';
    }

    // Show toast with animation
    toast.style.transform = 'translateY(0)';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(150%)';
    }, 3000);
}

// Make functions globally accessible for inline onclick handlers
globalThis.showLabelModal = showLabelModal;
globalThis.removeLabel = removeLabel;
globalThis.deleteImage = deleteImage;