/**
 * Database Proxy Layer for AI Annotation Tool v2
 * Provides ORM-like interface with custom methods and transaction support
 *
 * Note: This is a lightweight wrapper around better-sqlite3 that mimics the
 * better-sqlite3-proxy API but works with our custom primary key names
 */

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

    proxyInstance = {
      // Images table methods
      images: {
        findWithLabels: function () {
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

        findByIdWithAnnotations: function (imageId) {
          const image = db.prepare('SELECT * FROM images WHERE image_id = ?').get(imageId);
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
        },

        findById: function (imageId) {
          return db.prepare('SELECT * FROM images WHERE image_id = ?').get(imageId);
        },

        findAll: function () {
          return db.prepare('SELECT * FROM images ORDER BY uploaded_at DESC').all();
        },

        create: function (data) {
          // Validate data
          const validation = validateData('images', data);
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }

          const stmt = db.prepare(`
            INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
            VALUES (@filename, @original_name, @file_path, @file_size, @mime_type)
          `);
          const result = stmt.run(data);
          return { image_id: result.lastInsertRowid, ...data };
        },

        update: function (imageId, data) {
          const updateFields = Object.keys(data).filter(key => key !== 'image_id');
          if (updateFields.length === 0) {
            return { changes: 0 };
          }

          const fields = updateFields.map(key => `${key} = @${key}`).join(', ');
          const stmt = db.prepare(`UPDATE images SET ${fields} WHERE image_id = @image_id`);
          const result = stmt.run({ ...data, image_id: imageId });
          return result;
        },

        delete: function (imageId) {
          const stmt = db.prepare('DELETE FROM images WHERE image_id = ?');
          return stmt.run(imageId);
        }
      },

      // Labels table methods
      labels: {
        findWithUsageStats: function () {
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

        findByNameOrCreate: function (labelName, description = null) {
          // Try to find existing label
          const existing = db.prepare('SELECT * FROM labels WHERE label_name = ?').get(labelName);
          if (existing) {
            return existing;
          }

          // Create new label if not found
          const stmt = db.prepare(`
            INSERT INTO labels (label_name, label_description)
            VALUES (?, ?)
          `);
          const result = stmt.run(labelName, description);
          return {
            label_id: result.lastInsertRowid,
            label_name: labelName,
            label_description: description,
            created_at: new Date().toISOString()
          };
        },

        findById: function (labelId) {
          return db.prepare('SELECT * FROM labels WHERE label_id = ?').get(labelId);
        },

        findAll: function () {
          return db.prepare('SELECT * FROM labels ORDER BY label_name').all();
        },

        create: function (data) {
          // Validate data
          const validation = validateData('labels', data);
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }

          const stmt = db.prepare(`
            INSERT INTO labels (label_name, label_description)
            VALUES (@label_name, @label_description)
          `);
          const result = stmt.run(data);
          return {
            label_id: result.lastInsertRowid,
            ...data,
            created_at: new Date().toISOString()
          };
        },

        update: function (labelId, data) {
          const updateFields = Object.keys(data).filter(key => key !== 'label_id');
          if (updateFields.length === 0) {
            return { changes: 0 };
          }

          const fields = updateFields.map(key => `${key} = @${key}`).join(', ');
          const stmt = db.prepare(`UPDATE labels SET ${fields} WHERE label_id = @label_id`);
          const result = stmt.run({ ...data, label_id: labelId });
          return result;
        },

        delete: function (labelId) {
          const stmt = db.prepare('DELETE FROM labels WHERE label_id = ?');
          return stmt.run(labelId);
        }
      },

      // Annotations table methods
      annotations: {
        findByImageId: function (imageId) {
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

        findByLabelId: function (labelId) {
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

        findAll: function () {
          return db.prepare('SELECT * FROM annotations ORDER BY created_at DESC').all();
        },

        createWithValidation: function (data) {
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

          // Create annotation
          const stmt = db.prepare(`
            INSERT INTO annotations (image_id, label_id, confidence)
            VALUES (@image_id, @label_id, @confidence)
          `);
          const result = stmt.run({
            image_id: data.image_id,
            label_id: data.label_id,
            confidence: data.confidence || 1.0
          });
          return {
            annotation_id: result.lastInsertRowid,
            ...data,
            created_at: new Date().toISOString()
          };
        },

        create: function (data) {
          const stmt = db.prepare(`
            INSERT INTO annotations (image_id, label_id, confidence)
            VALUES (@image_id, @label_id, @confidence)
          `);
          const result = stmt.run({
            image_id: data.image_id,
            label_id: data.label_id,
            confidence: data.confidence || 1.0
          });
          return {
            annotation_id: result.lastInsertRowid,
            ...data,
            created_at: new Date().toISOString()
          };
        },

        delete: function (annotationId) {
          const stmt = db.prepare('DELETE FROM annotations WHERE annotation_id = ?');
          return stmt.run(annotationId);
        }
      },

      // Transaction support
      transaction: function (callback) {
        return db.transaction(callback)();
      },

      // Direct database access
      db: db,

      // Export schemas for testing
      schemas: schemas
    };
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

/**
 * Reset proxy instance (for testing)
 */
function resetProxy() {
  proxyInstance = null;
}

// Export both the proxy instance and helper functions
module.exports = getProxy();
module.exports.getProxy = getProxy;
module.exports.resetProxy = resetProxy;
module.exports.schemas = schemas;
