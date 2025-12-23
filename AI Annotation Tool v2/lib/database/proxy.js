/**
 * Better-SQLite3-Proxy Integration for AI Annotation Tool v2
 * Provides ORM-like interface with type safety and transaction support
 */

const BetterSQLite3Proxy = require('better-sqlite3-proxy');
const { getDatabase } = require('./connection');
const { schemas, validateData } = require('./schemas');

let proxyInstance = null;

/**
 * Initialize the proxy with database connection
 * @returns {Object} Proxy instance with table methods
 */
function initializeProxy() {
  if (!proxyInstance) {
    const db = getDatabase();
    
    // Configure proxy with our schemas
    const proxyConfig = {
      database: db,
      tables: {
        images: {
          ...schemas.images,
          methods: {
            // Custom methods for images table
            findWithLabels: function() {
              return db.prepare(`
                SELECT 
                  i.*,
                  GROUP_CONCAT(l.label_name) as labels,
                  GROUP_CONCAT(a.confidence) as confidences
                FROM images i
                LEFT JOIN annotations a ON i.image_id = a.image_id
                LEFT JOIN labels l ON a.label_id = l.label_id
                GROUP BY i.image_id
                ORDER BY i.uploaded_at DESC
              `).all();
            },
            
            findByIdWithAnnotations: function(imageId) {
              const image = this.findById(imageId);
              if (!image) return undefined;
              
              const annotations = db.prepare(`
                SELECT 
                  a.*,
                  l.label_name,
                  l.label_description
                FROM annotations a
                JOIN labels l ON a.label_id = l.label_id
                WHERE a.image_id = ?
                ORDER BY a.confidence DESC
              `).all(imageId);
              
              return {
                ...image,
                annotations
              };
            }
          }
        },
        
        labels: {
          ...schemas.labels,
          methods: {
            // Custom methods for labels table
            findWithUsageStats: function() {
              return db.prepare(`
                SELECT 
                  l.*,
                  COUNT(a.annotation_id) as usage_count,
                  AVG(a.confidence) as avg_confidence
                FROM labels l
                LEFT JOIN annotations a ON l.label_id = a.label_id
                GROUP BY l.label_id
                ORDER BY usage_count DESC, l.label_name
              `).all();
            },
            
            findByNameOrCreate: function(labelName, description = null) {
              // Try to find existing label
              const existing = this.findOne({ label_name: labelName });
              if (existing) {
                return existing;
              }
              
              // Create new label if not found
              return this.create({
                label_name: labelName,
                label_description: description
              });
            }
          }
        },
        
        annotations: {
          ...schemas.annotations,
          methods: {
            // Custom methods for annotations table
            findByImageId: function(imageId) {
              return db.prepare(`
                SELECT 
                  a.*,
                  l.label_name,
                  l.label_description
                FROM annotations a
                JOIN labels l ON a.label_id = l.label_id
                WHERE a.image_id = ?
                ORDER BY a.confidence DESC
              `).all(imageId);
            },
            
            findByLabelId: function(labelId) {
              return db.prepare(`
                SELECT 
                  a.*,
                  i.filename,
                  i.original_name
                FROM annotations a
                JOIN images i ON a.image_id = i.image_id
                WHERE a.label_id = ?
                ORDER BY a.created_at DESC
              `).all(labelId);
            },
            
            createWithValidation: function(data) {
              // Validate confidence range
              if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
                throw new Error('Confidence must be between 0.0 and 1.0');
              }
              
              // Check for duplicate annotation
              const existing = db.prepare(`
                SELECT annotation_id FROM annotations 
                WHERE image_id = ? AND label_id = ?
              `).get(data.image_id, data.label_id);
              
              if (existing) {
                throw new Error('Annotation already exists for this image-label combination');
              }
              
              return this.create(data);
            }
          }
        }
      }
    };
    
    // Initialize proxy
    proxyInstance = new BetterSQLite3Proxy(proxyConfig);
    
    // Add transaction support
    proxyInstance.transaction = function(callback) {
      return db.transaction(callback)();
    };
    
    // Add validation wrapper for all create/update operations
    const originalCreate = proxyInstance.create;
    const originalUpdate = proxyInstance.update;
    
    // Wrap create methods with validation
    for (const tableName of Object.keys(schemas)) {
      const table = proxyInstance[tableName];
      if (table && table.create) {
        const originalTableCreate = table.create;
        table.create = function(data) {
          const validation = validateData(tableName, data);
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
          return originalTableCreate.call(this, data);
        };
      }
      
      if (table && table.update) {
        const originalTableUpdate = table.update;
        table.update = function(id, data) {
          const validation = validateData(tableName, data);
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
          return originalTableUpdate.call(this, id, data);
        };
      }
    }
  }
  
  return proxyInstance;
}

/**
 * Get proxy instance (singleton pattern)
 * @returns {Object} Proxy instance
 */
function getProxy() {
  if (!proxyInstance) {
    return initializeProxy();
  }
  return proxyInstance;
}

// Initialize and export proxy
const proxy = getProxy();

module.exports = proxy;