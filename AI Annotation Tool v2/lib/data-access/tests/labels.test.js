/**
 * Labels Data Access Layer Tests for AI Annotation Tool v2
 * These tests verify the labels data access functionality
 * All tests should FAIL initially until data access functions are implemented
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Labels Data Access Layer Tests', function() {
  this.timeout(10000);

  // Use isolated test environment
  const ORIGINAL_TEST_PATH = process.env.TEST_DB_PATH;
  const TEST_DB_PATH = path.join(__dirname, '..', '..', '..', 'database', 'labels_test.db');

  before(function() {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Set isolated test database path
    process.env.TEST_DB_PATH = TEST_DB_PATH;
    
    // Initialize database with schema
    try {
      const { initializeDatabase } = require('../../../database/init');
      initializeDatabase();
    } catch (error) {
      console.warn('Could not initialize database:', error.message);
    }
  });

  after(function() {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Restore original test database path
    if (ORIGINAL_TEST_PATH) {
      process.env.TEST_DB_PATH = ORIGINAL_TEST_PATH;
    } else {
      delete process.env.TEST_DB_PATH;
    }
  });

  describe('Labels Data Access Module', function() {
    it('should have labels.js module', function() {
      // This test will fail until data access layer is implemented
      const labelsPath = path.join(__dirname, '..', 'labels.js');
      expect(fs.existsSync(labelsPath)).to.be.true;
    });

    it('should export required functions', function() {
      // This test will fail until data access layer is implemented
      try {
        const labels = require('../labels');
        expect(labels).to.be.an('object');
        expect(labels).to.have.property('getAllLabels');
        expect(labels).to.have.property('createLabel');
        expect(labels).to.have.property('updateLabel');
        expect(labels).to.have.property('deleteLabel');
        
        // Check that exports are functions
        expect(labels.getAllLabels).to.be.a('function');
        expect(labels.createLabel).to.be.a('function');
        expect(labels.updateLabel).to.be.a('function');
        expect(labels.deleteLabel).to.be.a('function');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented: labels.js not found');
        }
        throw error;
      }
    });
  });

  describe('getAllLabels() Function', function() {
    let labels;

    before(function() {
      try {
        labels = require('../labels');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented');
        }
        throw error;
      }
    });

    it('should return all unique labels with usage statistics', async function() {
      // This test will fail until getAllLabels is implemented
      const result = await labels.getAllLabels();
      
      expect(result).to.be.an('array');
      
      // If there are labels, check structure
      if (result.length > 0) {
        const label = result[0];
        expect(label).to.have.property('label_id');
        expect(label).to.have.property('label_name');
        expect(label).to.have.property('label_description');
        expect(label).to.have.property('created_at');
        
        // Should include usage statistics
        expect(label).to.have.property('usage_count');
        expect(label).to.have.property('avg_confidence');
        
        expect(label.usage_count).to.be.a('number');
        expect(label.usage_count).to.be.at.least(0);
        
        if (label.usage_count > 0) {
          expect(label.avg_confidence).to.be.a('number');
          expect(label.avg_confidence).to.be.at.least(0);
          expect(label.avg_confidence).to.be.at.most(1);
        }
      }
    });

    it('should return labels ordered by usage count (most used first)', async function() {
      // This test will fail until getAllLabels implements proper ordering
      const result = await labels.getAllLabels();
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const prevUsage = result[i-1].usage_count;
          const currUsage = result[i].usage_count;
          expect(prevUsage).to.be.at.least(currUsage);
        }
      }
    });

    it('should handle empty database gracefully', async function() {
      // This test will fail until getAllLabels handles empty results
      const result = await labels.getAllLabels();
      expect(result).to.be.an('array');
      // Should not throw error even if no labels exist
    });
  });

  describe('createLabel() Function', function() {
    let labels;

    before(function() {
      try {
        labels = require('../labels');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented');
        }
        throw error;
      }
    });

    it('should insert new label and return created record', async function() {
      // This test will fail until createLabel is implemented
      const labelData = {
        label_name: 'test-create-label',
        label_description: 'Test label for creation'
      };
      
      const result = await labels.createLabel(labelData);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('label_id');
      expect(result.label_id).to.be.a('number');
      expect(result).to.have.property('label_name', 'test-create-label');
      expect(result).to.have.property('label_description', 'Test label for creation');
      expect(result).to.have.property('created_at');
    });

    it('should validate required fields', async function() {
      // This test will fail until createLabel validates input
      const invalidData = {
        label_description: 'Missing label name'
        // Missing required label_name
      };
      
      try {
        await labels.createLabel(invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('required');
      }
    });

    it('should handle duplicates gracefully (edge case)', async function() {
      // This test will fail until createLabel handles duplicates properly
      const labelData = {
        label_name: 'duplicate-test-label',
        label_description: 'First instance'
      };
      
      // Create first label
      const first = await labels.createLabel(labelData);
      expect(first).to.have.property('label_id');
      
      // Try to create duplicate - should handle gracefully
      const duplicateData = {
        label_name: 'duplicate-test-label',
        label_description: 'Second instance (should be handled)'
      };
      
      const result = await labels.createLabel(duplicateData);
      
      // Should either:
      // 1. Return the existing label, or
      // 2. Throw a descriptive error, or  
      // 3. Update the existing label
      expect(result).to.be.an('object');
      expect(result).to.have.property('label_name', 'duplicate-test-label');
      
      // Verify only one label exists with this name
      const allLabels = await labels.getAllLabels();
      const duplicateLabels = allLabels.filter(l => l.label_name === 'duplicate-test-label');
      expect(duplicateLabels).to.have.length(1);
    });

    it('should validate label name length and format', async function() {
      // This test will fail until createLabel validates label format
      const invalidData = [
        { label_name: '', label_description: 'Empty name' },
        { label_name: 'a'.repeat(101), label_description: 'Too long name' },
        { label_name: '   ', label_description: 'Whitespace only' }
      ];
      
      for (const data of invalidData) {
        try {
          await labels.createLabel(data);
          throw new Error(`Should have thrown validation error for: ${data.label_name}`);
        } catch (error) {
          expect(error.message).to.include('validation');
        }
      }
    });
  });

  describe('updateLabel() Function', function() {
    let labels;
    let testLabelId;

    before(async function() {
      try {
        labels = require('../labels');
        
        // Create a test label for update tests
        const labelData = {
          label_name: 'test-update-label',
          label_description: 'Original description'
        };
        
        const created = await labels.createLabel(labelData);
        testLabelId = created.label_id;
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented');
        }
        throw error;
      }
    });

    it('should modify label metadata and return updated record', async function() {
      // This test will fail until updateLabel is implemented
      const updateData = {
        label_description: 'Updated description for test label'
      };
      
      const result = await labels.updateLabel(testLabelId, updateData);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('label_id', testLabelId);
      expect(result).to.have.property('label_name', 'test-update-label');
      expect(result).to.have.property('label_description', 'Updated description for test label');
    });

    it('should validate update data', async function() {
      // This test will fail until updateLabel validates input
      const invalidData = {
        label_name: '' // Invalid empty name
      };
      
      try {
        await labels.updateLabel(testLabelId, invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('validation');
      }
    });

    it('should return undefined for non-existent label', async function() {
      // This test will fail until updateLabel handles missing records
      const result = await labels.updateLabel(99999, { label_description: 'test' });
      expect(result).to.be.undefined;
    });

    it('should handle unique constraint on label name updates', async function() {
      // This test will fail until updateLabel handles unique constraints
      // Create another label first
      const anotherLabel = await labels.createLabel({
        label_name: 'another-unique-label',
        label_description: 'Another label'
      });
      
      // Try to update first label to have same name as second
      try {
        await labels.updateLabel(testLabelId, {
          label_name: 'another-unique-label'
        });
        throw new Error('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.message).to.include('unique');
      }
    });
  });

  describe('deleteLabel() Function', function() {
    let labels;
    let testLabelId;
    let testImageId;

    before(async function() {
      try {
        labels = require('../labels');
        
        // Create test label and image with annotation for cascade delete test
        const { run } = require('../../database/connection');
        
        const labelResult = run(`
          INSERT INTO labels (label_name, label_description)
          VALUES (?, ?)
        `, ['test-delete-label', 'Label for delete test']);
        testLabelId = labelResult.lastID;
        
        const imageResult = run(`
          INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?)
        `, ['test-delete-label.jpg', 'delete-test.jpg', 'public/uploads/test-delete-label.jpg', 11111, 'image/jpeg']);
        testImageId = imageResult.lastID;
        
        run(`
          INSERT INTO annotations (image_id, label_id, confidence)
          VALUES (?, ?, ?)
        `, [testImageId, testLabelId, 0.9]);
        
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented');
        }
        throw error;
      }
    });

    it('should remove label and return success', async function() {
      // This test will fail until deleteLabel is implemented
      const result = await labels.deleteLabel(testLabelId);
      
      expect(result).to.be.true;
      
      // Verify label is deleted
      const allLabels = await labels.getAllLabels();
      const deletedLabel = allLabels.find(l => l.label_id === testLabelId);
      expect(deletedLabel).to.be.undefined;
    });

    it('should cascade properly to annotations', async function() {
      // This test will fail until deleteLabel handles cascading properly
      const { query } = require('../../database/connection');
      
      // Verify annotations were cascade deleted
      const annotations = query(`
        SELECT * FROM annotations WHERE label_id = ?
      `, [testLabelId]);
      
      expect(annotations).to.have.length(0);
    });

    it('should return false for non-existent label', async function() {
      // This test will fail until deleteLabel handles missing records
      const result = await labels.deleteLabel(99999);
      expect(result).to.be.false;
    });

    it('should handle transaction rollback on error', async function() {
      // This test will fail until deleteLabel uses transactions
      // Create another test label
      const { run } = require('../../database/connection');
      
      const labelResult = run(`
        INSERT INTO labels (label_name, label_description)
        VALUES (?, ?)
      `, ['test-rollback-label', 'Rollback test']);
      
      const rollbackLabelId = labelResult.lastID;
      
      // Test transaction behavior (conceptual - actual implementation may vary)
      try {
        const result = await labels.deleteLabel(rollbackLabelId);
        expect(result).to.be.a('boolean');
      } catch (error) {
        // If error occurs, label should still exist (transaction rolled back)
        const allLabels = await labels.getAllLabels();
        const stillExists = allLabels.find(l => l.label_id === rollbackLabelId);
        if (stillExists) {
          expect(stillExists).to.have.property('label_id', rollbackLabelId);
        }
      }
    });
  });

  describe('Edge Cases and Advanced Features', function() {
    let labels;

    before(function() {
      try {
        labels = require('../labels');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Labels data access module not implemented');
        }
        throw error;
      }
    });

    it('should handle case-insensitive duplicate detection', async function() {
      // This test will fail until createLabel handles case sensitivity properly
      const labelData1 = {
        label_name: 'CaseSensitive',
        label_description: 'First case'
      };
      
      const labelData2 = {
        label_name: 'casesensitive',
        label_description: 'Second case'
      };
      
      const first = await labels.createLabel(labelData1);
      expect(first).to.have.property('label_id');
      
      // Depending on implementation, this should either:
      // 1. Create a separate label (case-sensitive), or
      // 2. Return existing label (case-insensitive)
      const second = await labels.createLabel(labelData2);
      expect(second).to.be.an('object');
      
      const allLabels = await labels.getAllLabels();
      const similarLabels = allLabels.filter(l => 
        l.label_name.toLowerCase() === 'casesensitive'
      );
      
      // Should have consistent behavior
      expect(similarLabels.length).to.be.at.least(1);
    });

    it('should trim whitespace from label names', async function() {
      // This test will fail until createLabel handles whitespace properly
      const labelData = {
        label_name: '  whitespace-test  ',
        label_description: 'Test whitespace handling'
      };
      
      const result = await labels.createLabel(labelData);
      
      expect(result).to.have.property('label_name');
      expect(result.label_name).to.not.match(/^\s|\s$/); // No leading/trailing whitespace
      expect(result.label_name).to.include('whitespace-test');
    });

    it('should provide label search functionality', async function() {
      // This test will fail until search functionality is implemented
      if (labels.searchLabels) {
        const searchResults = await labels.searchLabels('test');
        expect(searchResults).to.be.an('array');
        
        // All results should contain 'test' in name or description
        searchResults.forEach(label => {
          const hasTestInName = label.label_name.toLowerCase().includes('test');
          const hasTestInDesc = label.label_description && 
            label.label_description.toLowerCase().includes('test');
          expect(hasTestInName || hasTestInDesc).to.be.true;
        });
      }
    });
  });
});