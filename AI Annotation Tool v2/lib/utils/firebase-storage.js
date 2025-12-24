/**
 * Firebase Storage Utility Module
 * Provides helper functions for uploading and deleting images from Firebase Storage via Vercel API
 */

const VERCEL_API_URL = 'https://vercel-express-api-alpha.vercel.app';
const API_PASSCODE = 'PourRice';

/**
 * Upload an image to Firebase Storage via Vercel API
 * @param {File|Buffer} file - The file to upload
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder path in Firebase Storage
 * @param {string} token - Firebase auth token (optional for this API)
 * @returns {Promise<Object>} Upload result with imageUrl, fileName, fileSize, mimeType
 */
async function uploadToFirebase(file, originalName, folder = 'Annotations', token) {
  try {
    // Handle mock scenario for testing
    if (token === 'mock-firebase-token' || process.env.NODE_ENV === 'test') {
      // Mock successful Firebase upload for testing
      const timestamp = Date.now();
      const fileName = `${timestamp}_${originalName}`;
      const mockUrl = `https://firebasestorage.googleapis.com/v0/b/test-bucket/o/${folder}%2F${fileName}?alt=media&token=mock-token-${timestamp}`;

      return {
        success: true,
        imageUrl: mockUrl,
        fileName: fileName,
        fileSize: file.size || Buffer.byteLength(file),
        mimeType: file.type || 'image/jpeg'
      };
    }

    // Create FormData for multipart upload
    const formData = new FormData();

    // Handle different file types (Buffer for server-side, File for client-side)
    if (Buffer.isBuffer(file)) {
      // Server-side: Convert Buffer to Blob
      const blob = new Blob([file], { type: file.type || 'image/jpeg' });
      formData.append('image', blob, originalName);
    } else {
      // Client-side: Use File directly
      formData.append('image', file);
    }

    // Make request to Vercel API with proper headers
    console.log('Making request to:', `${VERCEL_API_URL}/API/Images/upload?folder=${encodeURIComponent(folder)}`);

    const headers = {
      'x-api-passcode': API_PASSCODE
    };

    // Add authorization header if token is provided and not mock
    if (token && token !== 'mock-firebase-token') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Headers:', headers);

    const response = await fetch(`${VERCEL_API_URL}/API/Images/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }

      // Handle authentication errors specifically
      if (response.status === 401) {
        throw new Error('Authentication required: Please provide a valid Bearer token for image uploads');
      } else if (response.status === 403) {
        throw new Error('Access forbidden: Invalid authentication credentials');
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
    }

    // Return standardized response
    return {
      success: true,
      imageUrl: data.imageUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType
    };

  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    throw new Error(`Firebase upload failed: ${error.message}`);
  }
}

/**
 * Delete an image from Firebase Storage via Vercel API
 * @param {string} filePath - The file path in Firebase Storage (e.g., "Annotations/1234567890_image.jpg")
 * @param {string} token - Firebase auth token (optional for this API)
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFromFirebase(filePath, token) {
  try {
    // Handle mock scenario for testing
    if (token === 'mock-firebase-token' || process.env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Image deleted successfully (mock)',
        filePath
      };
    }

    // Make request to Vercel API
    const response = await fetch(`${VERCEL_API_URL}/API/Images/delete`, {
      method: 'DELETE',
      headers: {
        'x-api-passcode': API_PASSCODE,
        'Content-Type': 'application/json',
        ...(token && token !== 'mock-firebase-token' ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        filePath: filePath
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      // 404 is acceptable - file may already be deleted
      if (response.status === 404) {
        console.warn(`File not found in Firebase Storage: ${filePath}`);
        return {
          success: true,
          message: 'File not found (may have been already deleted)',
          filePath
        };
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Image deleted successfully',
      filePath: data.filePath
    };

  } catch (error) {
    console.error('Error deleting from Firebase:', error);
    throw new Error(`Firebase deletion failed: ${error.message}`);
  }
}

/**
 * Validate file type is an allowed image format
 * @param {string} mimeType - The MIME type to validate
 * @returns {boolean} True if valid image type
 */
function validateImageType(mimeType) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size doesn't exceed limit
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum size in bytes (default 10MB)
 * @returns {boolean} True if file size is acceptable
 */
function validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) {
  return fileSize <= maxSize;
}

/**
 * Extract filename from Firebase Storage URL
 * @param {string} url - Firebase Storage URL
 * @returns {string} Extracted filename
 */
function extractFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract filename from path like /v0/b/bucket/o/folder%2Ffilename.jpg
    const match = pathname.match(/\/o\/(.+)$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    return '';
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return '';
  }
}

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  validateImageType,
  validateFileSize,
  extractFilenameFromUrl
};
