/**
 * Images Data Access Layer for AI Annotation Tool v2
 * Provides high-level interface for image operations using ORM proxy
 */

const proxy = require('../database/proxy');
const { validateData } = require('../database/schemas');

/**
 * Get all images with their labels and statistics
 * @returns {Promise<Array>} Array of images with label information
 */
async function getAllImages() {
  try {
    // Use proxy method for eager loading of labels
    const images = proxy.images.findWithLabels();
    
    // Process the results to format labels properly
    return images.map(image => ({
      ...image,
      labels: image.labels ? image.labels.split(',') : [],
      confidences: image.confidences ? image.confidences.split(',').map(Number) : [],
      label_count: image.labels ? image.labels.split(',').length : 0
    }));
    
  } catch (error) {
    console.error('Error in getAllImages:', error);
    throw new Error(`Failed to retrieve images: ${error.message}`);
  }
}

/**
 * Get a single image by ID with all its annotations
 * @param {number} imageId - The image ID
 * @returns {Promise<Object|undefined>} Image with annotations or undefined if not found
 */
async function getImageById(imageId) {
  try {
    if (!imageId || !Number.isInteger(imageId)) {
      throw new Error('Valid image ID is required');
    }
    
    // Use proxy method for finding image with annotations
    const image = proxy.images.findByIdWithAnnotations(imageId);
    
    return image;
    
  } catch (error) {
    console.error('Error in getImageById:', error);
    throw new Error(`Failed to retrieve image: ${error.message}`);
  }
}

/**
 * Create a new image record
 * @param {Object} imageData - Image data to insert
 * @returns {Promise<Object>} Created image record
 */
async function createImage(imageData) {
  try {
    // Validate required fields
    const requiredFields = ['filename', 'original_name', 'file_path', 'file_size', 'mime_type'];
    for (const field of requiredFields) {
      if (!imageData[field]) {
        throw new Error(`Field '${field}' is required`);
      }
    }
    
    // Validate data against schema
    const validation = validateData('images', imageData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use transaction for atomic operation
    return proxy.transaction(() => {
      const created = proxy.images.create(imageData);
      
      // Return the full created record
      return proxy.images.findById(created.image_id);
    });
    
  } catch (error) {
    console.error('Error in createImage:', error);

    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('unique')) {
      throw new Error('Image with this filename already exists (unique constraint violation)');
    }

    throw new Error(`Failed to create image: ${error.message}`);
  }
}

/**
 * Update an existing image record
 * @param {number} imageId - The image ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|undefined>} Updated image record or undefined if not found
 */
async function updateImage(imageId, updateData) {
  try {
    if (!imageId || !Number.isInteger(imageId)) {
      throw new Error('Valid image ID is required');
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }
    
    // Validate update data against schema (partial validation)
    const validation = validateData('images', updateData, { partial: true });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use transaction for atomic operation
    return proxy.transaction(() => {
      // Check if image exists
      const existing = proxy.images.findById(imageId);
      if (!existing) {
        return undefined;
      }
      
      // Add updated_at timestamp
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Update the record
      proxy.images.update(imageId, dataWithTimestamp);
      
      // Return the updated record
      return proxy.images.findById(imageId);
    });
    
  } catch (error) {
    console.error('Error in updateImage:', error);
    
    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('An image with this filename already exists');
    }
    
    throw new Error(`Failed to update image: ${error.message}`);
  }
}

/**
 * Delete an image and cascade to annotations
 * @param {number} imageId - The image ID to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteImage(imageId) {
  try {
    if (!imageId || !Number.isInteger(imageId)) {
      throw new Error('Valid image ID is required');
    }
    
    // Use transaction for atomic operation with cascade handling
    return proxy.transaction(() => {
      // Check if image exists
      const existing = proxy.images.findById(imageId);
      if (!existing) {
        return false;
      }
      
      // Delete annotations first (explicit cascade handling)
      const annotations = proxy.annotations.findByImageId(imageId);
      for (const annotation of annotations) {
        proxy.annotations.delete(annotation.annotation_id);
      }
      
      // Delete the image
      const result = proxy.images.delete(imageId);
      
      return result.changes > 0;
    });
    
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Search images by label name
 * @param {string} labelName - Label name to search for
 * @returns {Promise<Array>} Array of images with the specified label
 */
async function searchImagesByLabel(labelName) {
  try {
    if (!labelName || typeof labelName !== 'string') {
      throw new Error('Valid label name is required');
    }
    
    const { query } = require('../database/connection');
    
    const images = query(`
      SELECT DISTINCT 
        i.*,
        GROUP_CONCAT(l2.label_name) as labels,
        GROUP_CONCAT(a2.confidence) as confidences
      FROM images i
      JOIN annotations a ON i.image_id = a.image_id
      JOIN labels l ON a.label_id = l.label_id
      LEFT JOIN annotations a2 ON i.image_id = a2.image_id
      LEFT JOIN labels l2 ON a2.label_id = l2.label_id
      WHERE l.label_name = ?
      GROUP BY i.image_id
      ORDER BY i.uploaded_at DESC
    `, [labelName]);
    
    // Process the results to format labels properly
    return images.map(image => ({
      ...image,
      labels: image.labels ? image.labels.split(',') : [],
      confidences: image.confidences ? image.confidences.split(',').map(Number) : [],
      label_count: image.labels ? image.labels.split(',').length : 0
    }));
    
  } catch (error) {
    console.error('Error in searchImagesByLabel:', error);
    throw new Error(`Failed to search images: ${error.message}`);
  }
}

/**
 * Get image statistics
 * @returns {Promise<Object>} Statistics about images
 */
async function getImageStats() {
  try {
    const { query } = require('../database/connection');
    
    const stats = query(`
      SELECT 
        COUNT(*) as total_images,
        AVG(file_size) as avg_file_size,
        MIN(file_size) as min_file_size,
        MAX(file_size) as max_file_size,
        COUNT(DISTINCT mime_type) as mime_types_count,
        MIN(uploaded_at) as oldest_upload,
        MAX(uploaded_at) as newest_upload
      FROM images
    `)[0];
    
    const annotationStats = query(`
      SELECT 
        COUNT(*) as total_annotations,
        AVG(confidence) as avg_confidence,
        COUNT(DISTINCT image_id) as annotated_images
      FROM annotations
    `)[0];
    
    return {
      ...stats,
      ...annotationStats,
      unannotated_images: stats.total_images - annotationStats.annotated_images
    };
    
  } catch (error) {
    console.error('Error in getImageStats:', error);
    throw new Error(`Failed to get image statistics: ${error.message}`);
  }
}

/**
 * Add annotation to an image
 * @param {number} imageId - The image ID
 * @param {number} labelId - The label ID
 * @param {number} confidence - Confidence score (0.0 to 1.0)
 * @returns {Promise<Object>} Created annotation
 */
async function addAnnotationToImage(imageId, labelId, confidence = 1.0) {
  try {
    if (!imageId || !Number.isInteger(imageId)) {
      throw new Error('Valid image ID is required');
    }
    
    if (!labelId || !Number.isInteger(labelId)) {
      throw new Error('Valid label ID is required');
    }
    
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0.0 and 1.0');
    }
    
    // Use transaction for atomic operation
    return proxy.transaction(() => {
      // Verify image exists
      const image = proxy.images.findById(imageId);
      if (!image) {
        throw new Error('Image not found');
      }
      
      // Verify label exists
      const label = proxy.labels.findById(labelId);
      if (!label) {
        throw new Error('Label not found');
      }
      
      // Create annotation with validation
      return proxy.annotations.createWithValidation({
        image_id: imageId,
        label_id: labelId,
        confidence: confidence
      });
    });
    
  } catch (error) {
    console.error('Error in addAnnotationToImage:', error);
    throw new Error(`Failed to add annotation: ${error.message}`);
  }
}

module.exports = {
  getAllImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  searchImagesByLabel,
  getImageStats,
  addAnnotationToImage
};