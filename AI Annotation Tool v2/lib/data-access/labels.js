/**
 * Labels Data Access Layer for AI Annotation Tool v2
 * Provides high-level interface for label operations with duplicate handling
 */

const proxy = require('../database/proxy');
const { validateData } = require('../database/schemas');

/**
 * Get all labels with usage statistics
 * @returns {Promise<Array>} Array of labels with usage information
 */
async function getAllLabels() {
  try {
    // Use proxy method for labels with usage stats
    const labels = proxy.labels.findWithUsageStats();
    
    return labels;
    
  } catch (error) {
    console.error('Error in getAllLabels:', error);
    throw new Error(`Failed to retrieve labels: ${error.message}`);
  }
}

/**
 * Create a new label with duplicate handling (edge case)
 * @param {Object} labelData - Label data to insert
 * @returns {Promise<Object>} Created or existing label record
 */
async function createLabel(labelData) {
  try {
    // Validate required fields
    if (!labelData.label_name || typeof labelData.label_name !== 'string') {
      throw new Error('Label validation failed: Field \'label_name\' is required and must be a string');
    }

    // Trim whitespace from label name
    const trimmedName = labelData.label_name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Label validation failed: Label name cannot be empty or whitespace only');
    }

    if (trimmedName.length > 100) {
      throw new Error('Label validation failed: Label name cannot exceed 100 characters');
    }
    
    const processedData = {
      ...labelData,
      label_name: trimmedName
    };
    
    // Validate data against schema
    const validation = validateData('labels', processedData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Handle duplicates gracefully using proxy method
    return proxy.transaction(() => {
      return proxy.labels.findByNameOrCreate(
        processedData.label_name, 
        processedData.label_description
      );
    });
    
  } catch (error) {
    console.error('Error in createLabel:', error);
    throw new Error(`Failed to create label: ${error.message}`);
  }
}
/**
 * Update an existing label record
 * @param {number} labelId - The label ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|undefined>} Updated label record or undefined if not found
 */
async function updateLabel(labelId, updateData) {
  try {
    if (!labelId || !Number.isInteger(labelId)) {
      throw new Error('Valid label ID is required');
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required');
    }
    
    // Process label name if provided
    if (updateData.label_name) {
      const trimmedName = updateData.label_name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Label name cannot be empty or whitespace only');
      }
      if (trimmedName.length > 100) {
        throw new Error('Label name cannot exceed 100 characters');
      }
      updateData.label_name = trimmedName;
    }
    
    // Validate update data against schema (partial validation)
    const validation = validateData('labels', updateData, { partial: true });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use transaction for atomic operation
    return proxy.transaction(() => {
      // Check if label exists
      const existing = proxy.labels.findById(labelId);
      if (!existing) {
        return undefined;
      }
      
      // Update the record
      proxy.labels.update(labelId, updateData);
      
      // Return the updated record
      return proxy.labels.findById(labelId);
    });
    
  } catch (error) {
    console.error('Error in updateLabel:', error);

    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('unique')) {
      throw new Error('Label with this name already exists (unique constraint violation)');
    }

    throw new Error(`Failed to update label: ${error.message}`);
  }
}

/**
 * Delete a label and cascade to annotations
 * @param {number} labelId - The label ID to delete
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteLabel(labelId) {
  try {
    if (!labelId || !Number.isInteger(labelId)) {
      throw new Error('Valid label ID is required');
    }
    
    // Use transaction for atomic operation with cascade handling
    return proxy.transaction(() => {
      // Check if label exists
      const existing = proxy.labels.findById(labelId);
      if (!existing) {
        return false;
      }
      
      // Delete annotations first (explicit cascade handling)
      const annotations = proxy.annotations.findByLabelId(labelId);
      for (const annotation of annotations) {
        proxy.annotations.delete(annotation.annotation_id);
      }
      
      // Delete the label
      const result = proxy.labels.delete(labelId);
      
      return result.changes > 0;
    });
    
  } catch (error) {
    console.error('Error in deleteLabel:', error);
    throw new Error(`Failed to delete label: ${error.message}`);
  }
}
/**
 * Search labels by name or description
 * @param {string} searchTerm - Term to search for
 * @returns {Promise<Array>} Array of matching labels
 */
async function searchLabels(searchTerm) {
  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error('Valid search term is required');
    }
    
    const { query } = require('../database/connection');
    
    const labels = query(`
      SELECT 
        l.*,
        COUNT(a.annotation_id) as usage_count,
        AVG(a.confidence) as avg_confidence
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      WHERE l.label_name LIKE ? OR l.label_description LIKE ?
      GROUP BY l.label_id
      ORDER BY usage_count DESC, l.label_name
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    
    return labels;
    
  } catch (error) {
    console.error('Error in searchLabels:', error);
    throw new Error(`Failed to search labels: ${error.message}`);
  }
}

/**
 * Get label by name (case-insensitive)
 * @param {string} labelName - Name of the label
 * @returns {Promise<Object|undefined>} Label record or undefined if not found
 */
async function getLabelByName(labelName) {
  try {
    if (!labelName || typeof labelName !== 'string') {
      throw new Error('Valid label name is required');
    }
    
    const { queryOne } = require('../database/connection');
    
    const label = queryOne(`
      SELECT 
        l.*,
        COUNT(a.annotation_id) as usage_count,
        AVG(a.confidence) as avg_confidence
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      WHERE LOWER(l.label_name) = LOWER(?)
      GROUP BY l.label_id
    `, [labelName.trim()]);
    
    return label;
    
  } catch (error) {
    console.error('Error in getLabelByName:', error);
    throw new Error(`Failed to get label by name: ${error.message}`);
  }
}

/**
 * Get label statistics
 * @returns {Promise<Object>} Statistics about labels
 */
async function getLabelStats() {
  try {
    const { query } = require('../database/connection');
    
    const stats = query(`
      SELECT 
        COUNT(*) as total_labels,
        COUNT(CASE WHEN usage_count > 0 THEN 1 END) as used_labels,
        COUNT(CASE WHEN usage_count = 0 THEN 1 END) as unused_labels,
        AVG(usage_count) as avg_usage_per_label,
        MAX(usage_count) as max_usage
      FROM (
        SELECT 
          l.label_id,
          COUNT(a.annotation_id) as usage_count
        FROM labels l
        LEFT JOIN annotations a ON l.label_id = a.label_id
        GROUP BY l.label_id
      ) label_usage
    `)[0];
    
    return stats;
    
  } catch (error) {
    console.error('Error in getLabelStats:', error);
    throw new Error(`Failed to get label statistics: ${error.message}`);
  }
}

module.exports = {
  getAllLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  searchLabels,
  getLabelByName,
  getLabelStats
};