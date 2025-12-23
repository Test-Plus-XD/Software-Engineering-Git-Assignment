/**
 * Base Data Access Class for AI Annotation Tool v2
 * Provides common CRUD operations and patterns to reduce code duplication
 */

const proxy = require('../database/proxy');
const { validateData } = require('../database/schemas');

/**
 * Base class for data access operations
 */
class BaseDataAccess {
  /**
   * Constructor
   * @param {string} tableName - Name of the database table
   * @param {string} primaryKey - Name of the primary key column (default: 'id')
   */
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.table = proxy[tableName];
    
    if (!this.table) {
      throw new Error(`Table '${tableName}' not found in proxy`);
    }
  }

  /**
   * Find all records
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async findAll(options = {}) {
    try {
      const { orderBy, limit, offset } = options;
      
      let records = this.table.findAll();
      
      // Apply ordering
      if (orderBy) {
        records = this.applyOrdering(records, orderBy);
      }
      
      // Apply pagination
      if (offset) {
        records = records.slice(offset);
      }
      
      if (limit) {
        records = records.slice(0, limit);
      }
      
      return records;
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.findAll:`, error);
      throw new Error(`Failed to retrieve ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|undefined>} Record or undefined if not found
   */
  async findById(id) {
    try {
      if (!id || !Number.isInteger(id)) {
        throw new Error(`Valid ${this.primaryKey} is required`);
      }
      
      return this.table.findById(id);
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.findById:`, error);
      throw new Error(`Failed to retrieve ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Data to insert
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Data is required for creation');
      }
      
      // Validate data against schema
      const validation = validateData(this.tableName, data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Use transaction for atomic operation
      return proxy.transaction(() => {
        const created = this.table.create(data);
        return this.table.findById(created[this.primaryKey]);
      });
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.create:`, error);
      
      // Handle unique constraint violations
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`A ${this.tableName.slice(0, -1)} with this data already exists`);
      }
      
      throw new Error(`Failed to create ${this.tableName.slice(0, -1)}: ${error.message}`);
    }
  }
  /**
   * Update an existing record
   * @param {number} id - Record ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|undefined>} Updated record or undefined if not found
   */
  async update(id, updateData) {
    try {
      if (!id || !Number.isInteger(id)) {
        throw new Error(`Valid ${this.primaryKey} is required`);
      }
      
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error('Update data is required');
      }
      
      // Validate update data against schema (partial validation)
      const validation = validateData(this.tableName, updateData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Use transaction for atomic operation
      return proxy.transaction(() => {
        // Check if record exists
        const existing = this.table.findById(id);
        if (!existing) {
          return undefined;
        }
        
        // Add updated timestamp if table has updated_at column
        const dataWithTimestamp = this.addTimestamp(updateData, 'updated_at');
        
        // Update the record
        this.table.update(id, dataWithTimestamp);
        
        // Return the updated record
        return this.table.findById(id);
      });
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.update:`, error);
      
      // Handle unique constraint violations
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`A ${this.tableName.slice(0, -1)} with this data already exists`);
      }
      
      throw new Error(`Failed to update ${this.tableName.slice(0, -1)}: ${error.message}`);
    }
  }

  /**
   * Delete a record
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      if (!id || !Number.isInteger(id)) {
        throw new Error(`Valid ${this.primaryKey} is required`);
      }
      
      // Use transaction for atomic operation
      return proxy.transaction(() => {
        // Check if record exists
        const existing = this.table.findById(id);
        if (!existing) {
          return false;
        }
        
        // Handle cascade deletes if needed
        this.handleCascadeDeletes(id);
        
        // Delete the record
        const result = this.table.delete(id);
        
        return result.changes > 0;
      });
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.delete:`, error);
      throw new Error(`Failed to delete ${this.tableName.slice(0, -1)}: ${error.message}`);
    }
  }

  /**
   * Count records
   * @param {Object} conditions - Where conditions
   * @returns {Promise<number>} Number of records
   */
  async count(conditions = {}) {
    try {
      const records = this.table.findAll();
      
      if (Object.keys(conditions).length === 0) {
        return records.length;
      }
      
      // Apply conditions
      const filtered = records.filter(record => {
        return Object.entries(conditions).every(([key, value]) => {
          return record[key] === value;
        });
      });
      
      return filtered.length;
      
    } catch (error) {
      console.error(`Error in ${this.tableName}.count:`, error);
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Check if record exists
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    try {
      const record = await this.findById(id);
      return !!record;
    } catch (error) {
      console.error(`Error in ${this.tableName}.exists:`, error);
      return false;
    }
  }
  /**
   * Apply ordering to records
   * @param {Array} records - Records to order
   * @param {string|Object} orderBy - Order specification
   * @returns {Array} Ordered records
   */
  applyOrdering(records, orderBy) {
    if (typeof orderBy === 'string') {
      // Simple column name
      return records.sort((a, b) => {
        if (a[orderBy] < b[orderBy]) return -1;
        if (a[orderBy] > b[orderBy]) return 1;
        return 0;
      });
    }
    
    if (typeof orderBy === 'object') {
      // Object with column and direction
      const { column, direction = 'ASC' } = orderBy;
      const multiplier = direction.toLowerCase() === 'desc' ? -1 : 1;
      
      return records.sort((a, b) => {
        if (a[column] < b[column]) return -1 * multiplier;
        if (a[column] > b[column]) return 1 * multiplier;
        return 0;
      });
    }
    
    return records;
  }

  /**
   * Add timestamp to data if column exists
   * @param {Object} data - Data object
   * @param {string} timestampColumn - Timestamp column name
   * @returns {Object} Data with timestamp
   */
  addTimestamp(data, timestampColumn) {
    // Check if table has the timestamp column
    const { getSchema } = require('../database/schemas');
    const schema = getSchema(this.tableName);
    
    if (schema.columns[timestampColumn]) {
      return {
        ...data,
        [timestampColumn]: new Date().toISOString()
      };
    }
    
    return data;
  }

  /**
   * Handle cascade deletes (override in subclasses)
   * @param {number} id - Record ID being deleted
   */
  handleCascadeDeletes(id) {
    // Default implementation does nothing
    // Override in subclasses that need cascade handling
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If validation fails
   */
  validateRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Field '${field}' is required`);
      }
    }
  }

  /**
   * Sanitize string input (trim whitespace, validate length)
   * @param {string} value - String value to sanitize
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized string
   */
  sanitizeString(value, maxLength = 255) {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      throw new Error('String cannot be empty or whitespace only');
    }
    
    if (trimmed.length > maxLength) {
      throw new Error(`String cannot exceed ${maxLength} characters`);
    }
    
    return trimmed;
  }

  /**
   * Execute raw query (for complex operations)
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async executeQuery(sql, params = []) {
    try {
      const { query } = require('../database/connection');
      return query(sql, params);
    } catch (error) {
      console.error(`Error in ${this.tableName}.executeQuery:`, error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }
}

module.exports = BaseDataAccess;