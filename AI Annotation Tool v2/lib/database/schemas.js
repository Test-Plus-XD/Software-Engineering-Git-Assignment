/**
 * Database Schema Definitions for Better-SQLite3-Proxy
 * Defines table structures, column types, and relationships
 */

const schemas = {
  images: {
    tableName: 'images',
    columns: {
      image_id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true,
        nullable: false
      },
      filename: {
        type: 'TEXT',
        nullable: false,
        unique: true
      },
      original_name: {
        type: 'TEXT',
        nullable: false
      },
      file_path: {
        type: 'TEXT',
        nullable: false
      },
      file_size: {
        type: 'INTEGER',
        nullable: false,
        validate: (value) => value > 0
      },
      mime_type: {
        type: 'TEXT',
        nullable: false,
        validate: (value) => value.startsWith('image/')
      },
      uploaded_at: {
        type: 'DATETIME',
        nullable: false,
        default: 'CURRENT_TIMESTAMP'
      },
      updated_at: {
        type: 'DATETIME',
        nullable: false,
        default: 'CURRENT_TIMESTAMP'
      }
    },
    indexes: [
      { columns: ['filename'], unique: true },
      { columns: ['uploaded_at'] }
    ]
  },

  labels: {
    tableName: 'labels',
    columns: {
      label_id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true,
        nullable: false
      },
      label_name: {
        type: 'TEXT',
        nullable: false,
        unique: true,
        validate: (value) => value.length > 0 && value.length <= 100
      },
      label_description: {
        type: 'TEXT',
        nullable: true
      },
      created_at: {
        type: 'DATETIME',
        nullable: false,
        default: 'CURRENT_TIMESTAMP'
      }
    },
    indexes: [
      { columns: ['label_name'], unique: true }
    ]
  },

  annotations: {
    tableName: 'annotations',
    columns: {
      annotation_id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true,
        nullable: false
      },
      image_id: {
        type: 'INTEGER',
        nullable: false,
        foreignKey: {
          table: 'images',
          column: 'image_id',
          onDelete: 'CASCADE'
        }
      },
      label_id: {
        type: 'INTEGER',
        nullable: false,
        foreignKey: {
          table: 'labels',
          column: 'label_id',
          onDelete: 'CASCADE'
        }
      },
      confidence: {
        type: 'REAL',
        nullable: false,
        default: 1.0,
        validate: (value) => value >= 0.0 && value <= 1.0
      },
      created_at: {
        type: 'DATETIME',
        nullable: false,
        default: 'CURRENT_TIMESTAMP'
      }
    },
    indexes: [
      { columns: ['image_id'] },
      { columns: ['label_id'] },
      { columns: ['image_id', 'label_id'], unique: true }
    ],
    constraints: [
      {
        type: 'UNIQUE',
        columns: ['image_id', 'label_id']
      },
      {
        type: 'CHECK',
        expression: 'confidence >= 0.0 AND confidence <= 1.0'
      }
    ]
  }
};

/**
 * Get schema for a specific table
 * @param {string} tableName - Name of the table
 * @returns {Object} Table schema definition
 */
function getSchema(tableName) {
  if (!schemas[tableName]) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return schemas[tableName];
}

/**
 * Get all table names
 * @returns {Array} Array of table names
 */
function getTableNames() {
  return Object.keys(schemas);
}

/**
 * Validate data against schema
 * @param {string} tableName - Name of the table
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateData(tableName, data) {
  const schema = getSchema(tableName);
  const errors = [];
  const warnings = [];

  for (const [columnName, columnDef] of Object.entries(schema.columns)) {
    const value = data[columnName];

    // Check required fields
    if (!columnDef.nullable && (value === null || value === undefined)) {
      if (!columnDef.autoIncrement && !columnDef.default) {
        errors.push(`Column '${columnName}' is required`);
      }
    }

    // Check data types and validation
    if (value !== null && value !== undefined) {
      // Custom validation function
      if (columnDef.validate && typeof columnDef.validate === 'function') {
        try {
          if (!columnDef.validate(value)) {
            errors.push(`Column '${columnName}' failed validation`);
          }
        } catch (error) {
          errors.push(`Column '${columnName}' validation error: ${error.message}`);
        }
      }

      // Type checking
      if (columnDef.type === 'INTEGER' && !Number.isInteger(value)) {
        errors.push(`Column '${columnName}' must be an integer`);
      }

      if (columnDef.type === 'REAL' && typeof value !== 'number') {
        errors.push(`Column '${columnName}' must be a number`);
      }

      if (columnDef.type === 'TEXT' && typeof value !== 'string') {
        errors.push(`Column '${columnName}' must be a string`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get foreign key relationships for a table
 * @param {string} tableName - Name of the table
 * @returns {Array} Array of foreign key definitions
 */
function getForeignKeys(tableName) {
  const schema = getSchema(tableName);
  const foreignKeys = [];

  for (const [columnName, columnDef] of Object.entries(schema.columns)) {
    if (columnDef.foreignKey) {
      foreignKeys.push({
        column: columnName,
        ...columnDef.foreignKey
      });
    }
  }

  return foreignKeys;
}

/**
 * Get columns that reference a specific table
 * @param {string} referencedTable - Name of the referenced table
 * @returns {Array} Array of referencing columns
 */
function getReferencingColumns(referencedTable) {
  const references = [];

  for (const [tableName, schema] of Object.entries(schemas)) {
    for (const [columnName, columnDef] of Object.entries(schema.columns)) {
      if (columnDef.foreignKey && columnDef.foreignKey.table === referencedTable) {
        references.push({
          table: tableName,
          column: columnName,
          referencedColumn: columnDef.foreignKey.column,
          onDelete: columnDef.foreignKey.onDelete
        });
      }
    }
  }

  return references;
}

module.exports = {
  schemas,
  getSchema,
  getTableNames,
  validateData,
  getForeignKeys,
  getReferencingColumns
};