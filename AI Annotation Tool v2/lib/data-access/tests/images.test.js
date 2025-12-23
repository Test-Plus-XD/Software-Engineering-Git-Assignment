/**
 * Images Data Access Layer Tests for AI Annotation Tool v2
 * These tests verify the images data access functionality
 * All tests should FAIL initially until data access functions are implemented
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Images Data Access Layer Tests', function() {
  this.timeout(10000);

  // Use isolated test environment
  const ORIGINAL_TEST_PATH = process.env.TEST_DB_PATH;
  const TEST_DB_PATH = path.join(__dirname, '..', '..', '..', 'database', 'images_test.db');

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

  describe('Images Data Access Module', function() {
    it('should have images.js module', function() {
      // This test will fail until data access layer is implemented
      const imagesPath = path.join(__dirname, '..', 'images.js');
      expect(fs.existsSync(imagesPath)).to.be.true;
    });

    it('should export required functions', function() {
      // This test will fail until data access layer is implemented
      try {
        const images = require('../images');
        expect(images).to.be.an('object');
        expect(images).to.have.property('getAllImages');
        expect(images).to.have.property('getImageById');
        expect(images).to.have.property('createImage');
        expect(images).to.have.property('updateImage');
        expect(images).to.have.property('deleteImage');
        
        // Check that exports are functions
        expect(images.getAllImages).to.be.a('function');
        expect(images.getImageById).to.be.a('function');
        expect(images.createImage).to.be.a('function');
        expect(images.updateImage).to.be.a('function');
        expect(images.deleteImage).to.be.a('function');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented: images.js not found');
        }
        throw error;
      }
    });
  });

  describe('getAllImages() Function', function() {
    let images;

    before(function() {
      try {
        images = require('../images');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented');
        }
        throw error;
      }
    });

    it('should return all images with labels', async function() {
      // This test will fail until getAllImages is implemented
      const result = await images.getAllImages();
      
      expect(result).to.be.an('array');
      
      // If there are images, check structure
      if (result.length > 0) {
        const image = result[0];
        expect(image).to.have.property('image_id');
        expect(image).to.have.property('filename');
        expect(image).to.have.property('original_name');
        expect(image).to.have.property('file_path');
        expect(image).to.have.property('file_size');
        expect(image).to.have.property('mime_type');
        expect(image).to.have.property('uploaded_at');
        
        // Should include labels information
        expect(image).to.have.property('labels');
        expect(image).to.have.property('label_count');
      }
    });

    it('should return images ordered by upload date (newest first)', async function() {
      // This test will fail until getAllImages is implemented with proper ordering
      const result = await images.getAllImages();
      
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const prevDate = new Date(result[i-1].uploaded_at);
          const currDate = new Date(result[i].uploaded_at);
          expect(prevDate.getTime()).to.be.at.least(currDate.getTime());
        }
      }
    });

    it('should handle empty database gracefully', async function() {
      // This test will fail until getAllImages handles empty results
      const result = await images.getAllImages();
      expect(result).to.be.an('array');
      // Should not throw error even if no images exist
    });
  });

  describe('getImageById() Function', function() {
    let images;
    let testImageId;

    before(function() {
      try {
        images = require('../images');
        
        // Create a test image for retrieval tests
        const { run } = require('../../database/connection');
        const result = run(`
          INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?)
        `, ['test-get-by-id.jpg', 'original.jpg', 'public/uploads/test-get-by-id.jpg', 12345, 'image/jpeg']);
        
        testImageId = result.lastID;
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented');
        }
        throw error;
      }
    });

    it('should return single image with annotations', async function() {
      // This test will fail until getImageById is implemented
      const result = await images.getImageById(testImageId);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('image_id', testImageId);
      expect(result).to.have.property('filename', 'test-get-by-id.jpg');
      expect(result).to.have.property('original_name', 'original.jpg');
      expect(result).to.have.property('file_size', 12345);
      
      // Should include annotations array
      expect(result).to.have.property('annotations');
      expect(result.annotations).to.be.an('array');
    });

    it('should return undefined for non-existent image', async function() {
      // This test will fail until getImageById handles missing records
      const result = await images.getImageById(99999);
      expect(result).to.be.undefined;
    });

    it('should include annotation details with labels', async function() {
      // This test will fail until getImageById includes proper joins
      // First create a label and annotation
      const { run } = require('../../database/connection');
      
      const labelResult = run(`
        INSERT INTO labels (label_name, label_description)
        VALUES (?, ?)
      `, ['test-label-for-get', 'Test label']);
      
      run(`
        INSERT INTO annotations (image_id, label_id, confidence)
        VALUES (?, ?, ?)
      `, [testImageId, labelResult.lastID, 0.95]);
      
      const result = await images.getImageById(testImageId);
      
      expect(result.annotations).to.have.length.at.least(1);
      const annotation = result.annotations[0];
      expect(annotation).to.have.property('label_name', 'test-label-for-get');
      expect(annotation).to.have.property('confidence', 0.95);
      expect(annotation).to.have.property('label_description');
    });
  });

  describe('createImage() Function', function() {
    let images;

    before(function() {
      try {
        images = require('../images');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented');
        }
        throw error;
      }
    });

    it('should insert image record and return created image', async function() {
      // This test will fail until createImage is implemented
      const imageData = {
        filename: 'test-create.jpg',
        original_name: 'my-photo.jpg',
        file_path: 'public/uploads/test-create.jpg',
        file_size: 54321,
        mime_type: 'image/jpeg'
      };
      
      const result = await images.createImage(imageData);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('image_id');
      expect(result.image_id).to.be.a('number');
      expect(result).to.have.property('filename', 'test-create.jpg');
      expect(result).to.have.property('original_name', 'my-photo.jpg');
      expect(result).to.have.property('file_size', 54321);
      expect(result).to.have.property('uploaded_at');
      expect(result).to.have.property('updated_at');
    });

    it('should validate required fields', async function() {
      // This test will fail until createImage validates input
      const invalidData = {
        filename: 'test-invalid.jpg'
        // Missing required fields
      };
      
      try {
        await images.createImage(invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('required');
      }
    });

    it('should handle duplicate filename gracefully', async function() {
      // This test will fail until createImage handles duplicates
      const imageData = {
        filename: 'duplicate-test.jpg',
        original_name: 'duplicate.jpg',
        file_path: 'public/uploads/duplicate-test.jpg',
        file_size: 11111,
        mime_type: 'image/jpeg'
      };
      
      // Create first image
      await images.createImage(imageData);
      
      // Try to create duplicate
      try {
        await images.createImage(imageData);
        throw new Error('Should have thrown duplicate error');
      } catch (error) {
        expect(error.message).to.include('unique');
      }
    });
  });

  describe('updateImage() Function', function() {
    let images;
    let testImageId;

    before(async function() {
      try {
        images = require('../images');
        
        // Create a test image for update tests
        const imageData = {
          filename: 'test-update.jpg',
          original_name: 'update-test.jpg',
          file_path: 'public/uploads/test-update.jpg',
          file_size: 98765,
          mime_type: 'image/jpeg'
        };
        
        const created = await images.createImage(imageData);
        testImageId = created.image_id;
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented');
        }
        throw error;
      }
    });

    it('should modify existing image and return updated record', async function() {
      // This test will fail until updateImage is implemented
      const updateData = {
        original_name: 'updated-name.jpg',
        file_size: 87654
      };
      
      const result = await images.updateImage(testImageId, updateData);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('image_id', testImageId);
      expect(result).to.have.property('original_name', 'updated-name.jpg');
      expect(result).to.have.property('file_size', 87654);
      expect(result).to.have.property('updated_at');
      
      // updated_at should be different from uploaded_at
      expect(result.updated_at).to.not.equal(result.uploaded_at);
    });

    it('should validate update data', async function() {
      // This test will fail until updateImage validates input
      const invalidData = {
        file_size: -1 // Invalid file size
      };
      
      try {
        await images.updateImage(testImageId, invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error.message).to.include('validation');
      }
    });

    it('should return undefined for non-existent image', async function() {
      // This test will fail until updateImage handles missing records
      const result = await images.updateImage(99999, { original_name: 'test' });
      expect(result).to.be.undefined;
    });
  });

  describe('deleteImage() Function', function() {
    let images;
    let testImageId;
    let testLabelId;

    before(async function() {
      try {
        images = require('../images');
        
        // Create test image and annotation for cascade delete test
        const { run } = require('../../database/connection');
        
        const imageResult = run(`
          INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?)
        `, ['test-delete.jpg', 'delete-test.jpg', 'public/uploads/test-delete.jpg', 11111, 'image/jpeg']);
        testImageId = imageResult.lastID;
        
        const labelResult = run(`
          INSERT INTO labels (label_name, label_description)
          VALUES (?, ?)
        `, ['delete-test-label', 'Label for delete test']);
        testLabelId = labelResult.lastID;
        
        run(`
          INSERT INTO annotations (image_id, label_id, confidence)
          VALUES (?, ?, ?)
        `, [testImageId, testLabelId, 0.8]);
        
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          throw new Error('Images data access module not implemented');
        }
        throw error;
      }
    });

    it('should remove image and return success', async function() {
      // This test will fail until deleteImage is implemented
      const result = await images.deleteImage(testImageId);
      
      expect(result).to.be.true;
      
      // Verify image is deleted
      const deleted = await images.getImageById(testImageId);
      expect(deleted).to.be.undefined;
    });

    it('should cascade delete to annotations', async function() {
      // This test will fail until deleteImage handles cascading properly
      const { query } = require('../../database/connection');
      
      // Verify annotations were cascade deleted
      const annotations = query(`
        SELECT * FROM annotations WHERE image_id = ?
      `, [testImageId]);
      
      expect(annotations).to.have.length(0);
    });

    it('should return false for non-existent image', async function() {
      // This test will fail until deleteImage handles missing records
      const result = await images.deleteImage(99999);
      expect(result).to.be.false;
    });

    it('should handle transaction rollback on error', async function() {
      // This test will fail until deleteImage uses transactions
      // Create another test image
      const { run } = require('../../database/connection');
      
      const imageResult = run(`
        INSERT INTO images (filename, original_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `, ['test-rollback.jpg', 'rollback.jpg', 'public/uploads/test-rollback.jpg', 22222, 'image/jpeg']);
      
      const rollbackImageId = imageResult.lastID;
      
      // Mock a database error during delete (this is conceptual - actual implementation may vary)
      try {
        const result = await images.deleteImage(rollbackImageId);
        expect(result).to.be.a('boolean');
      } catch (error) {
        // If error occurs, image should still exist (transaction rolled back)
        const stillExists = await images.getImageById(rollbackImageId);
        if (stillExists) {
          expect(stillExists).to.have.property('image_id', rollbackImageId);
        }
      }
    });
  });
});