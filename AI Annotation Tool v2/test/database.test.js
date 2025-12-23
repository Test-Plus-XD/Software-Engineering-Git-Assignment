/**
 * Database Tests for AI Annotation Tool v2
 * Comprehensive Mocha test suite for database functionality using better-sqlite3
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { query, queryOne, run, closeDatabase } = require('../lib/database/connection');

describe('Database Tests', function() {
  // Increase timeout for database operations
  this.timeout(10000);

  const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test_annotations.db');
  const ORIGINAL_DB_PATH = path.join(__dirname, '..', 'database', 'annotations.db');

  before(function() {
    // Create a test database copy to avoid affecting the main database
    if (fs.existsSync(ORIGINAL_DB_PATH)) {
      fs.copyFileSync(ORIGINAL_DB_PATH, TEST_DB_PATH);
    } else {
      // If no main database exists, initialize one for testing
      const { initializeDatabase } = require('../database/init');
      initializeDatabase();
      if (fs.existsSync(ORIGINAL_DB_PATH)) {
        fs.copyFileSync(ORIGINAL_DB_PATH, TEST_DB_PATH);
      }
    }

    // Override the database path for testing
    process.env.TEST_DB_PATH = TEST_DB_PATH;
  });

  after(function() {
    // Clean up test database
    closeDatabase();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    delete process.env.TEST_DB_PATH;
  });

  describe('Database Connection', function() {
    it('should connect to the database successfully', function() {
      const result = query('SELECT 1 as test');
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('test', 1);
    });

    it('should have all required tables', function() {
      const tables = query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const tableNames = tables.map(t => t.name);
      expect(tableNames).to.include.members(['images', 'labels', 'annotations']);
    });

    it('should have foreign key constraints enabled', function() {
      const result = query('PRAGMA foreign_keys');
      expect(result[0]).to.have.property('foreign_keys', 1);
    });
  });

  describe('Images Table', function() {
    let testImageId;

    it('should insert a new image record', function() {
      const imageData = {
        filename: 'test-image.jpg',
        original_name: 'my-test-image.jpg',
        file_path: 'public/uploads/test-image.jpg',
        file_size: 123456,
        mime_type: 'image/jpeg'
      };

      const result = run(
        'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
        [imageData.filename, imageData.original_name, imageData.file_path, imageData.file_size, imageData.mime_type]
      );

      expect(result).to.have.property('lastID');
      expect(result.lastID).to.be.a('number');
      expect(result.changes).to.equal(1);
      
      testImageId = result.lastID;
    });

    it('should retrieve the inserted image', function() {
      const image = queryOne('SELECT * FROM images WHERE image_id = ?', [testImageId]);
      
      expect(image).to.be.an('object');
      expect(image).to.have.property('filename', 'test-image.jpg');
      expect(image).to.have.property('original_name', 'my-test-image.jpg');
      expect(image).to.have.property('file_size', 123456);
      expect(image).to.have.property('mime_type', 'image/jpeg');
      expect(image).to.have.property('uploaded_at');
      expect(image).to.have.property('updated_at');
    });

    it('should enforce unique filename constraint', function() {
      expect(() => {
        run(
          'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
          ['test-image.jpg', 'duplicate.jpg', 'public/uploads/duplicate.jpg', 789, 'image/jpeg']
        );
      }).to.throw();
    });

    it('should get all images', function() {
      const images = query('SELECT * FROM images ORDER BY uploaded_at DESC');
      expect(images).to.be.an('array');
      expect(images.length).to.be.at.least(1);
      
      // Check that our test image is included
      const testImage = images.find(img => img.image_id === testImageId);
      expect(testImage).to.exist;
    });

    after(function() {
      // Clean up test image
      if (testImageId) {
        run('DELETE FROM images WHERE image_id = ?', [testImageId]);
      }
    });
  });

  describe('Labels Table', function() {
    let testLabelId;

    it('should insert a new label', function() {
      const result = run(
        'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
        ['test-label', 'A test label for unit testing']
      );

      expect(result).to.have.property('lastID');
      expect(result.changes).to.equal(1);
      testLabelId = result.lastID;
    });

    it('should retrieve the inserted label', function() {
      const label = queryOne('SELECT * FROM labels WHERE label_id = ?', [testLabelId]);
      
      expect(label).to.be.an('object');
      expect(label).to.have.property('label_name', 'test-label');
      expect(label).to.have.property('label_description', 'A test label for unit testing');
      expect(label).to.have.property('created_at');
    });

    it('should enforce unique label name constraint', function() {
      expect(() => {
        run(
          'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
          ['test-label', 'Duplicate label']
        );
      }).to.throw();
    });

    it('should have sample labels from seed data', function() {
      const labels = query('SELECT * FROM labels ORDER BY label_name');
      expect(labels).to.be.an('array');
      expect(labels.length).to.be.at.least(10); // Should have seed data
      
      const labelNames = labels.map(l => l.label_name);
      expect(labelNames).to.include.members(['cat', 'dog', 'animal', 'person']);
    });

    after(function() {
      // Clean up test label
      if (testLabelId) {
        run('DELETE FROM labels WHERE label_id = ?', [testLabelId]);
      }
    });
  });

  describe('Annotations Table', function() {
    let testImageId, testLabelId, testAnnotationId;

    before(function() {
      // Create test image and label for annotation tests
      const imageResult = run(
        'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
        ['annotation-test.jpg', 'test.jpg', 'public/uploads/annotation-test.jpg', 100000, 'image/jpeg']
      );
      testImageId = imageResult.lastID;

      const labelResult = run(
        'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
        ['annotation-test-label', 'Test label for annotations']
      );
      testLabelId = labelResult.lastID;
    });

    it('should create an annotation', function() {
      const result = run(
        'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
        [testImageId, testLabelId, 0.95]
      );

      expect(result).to.have.property('lastID');
      expect(result.changes).to.equal(1);
      testAnnotationId = result.lastID;
    });

    it('should retrieve the annotation with joins', function() {
      const annotation = queryOne(`
        SELECT 
          a.*,
          i.filename,
          l.label_name
        FROM annotations a
        JOIN images i ON a.image_id = i.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE a.annotation_id = ?
      `, [testAnnotationId]);

      expect(annotation).to.be.an('object');
      expect(annotation).to.have.property('confidence', 0.95);
      expect(annotation).to.have.property('filename', 'annotation-test.jpg');
      expect(annotation).to.have.property('label_name', 'annotation-test-label');
    });

    it('should enforce confidence range constraint', function() {
      expect(() => {
        run(
          'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
          [testImageId, testLabelId, 1.5] // Invalid confidence > 1.0
        );
      }).to.throw();
    });

    it('should enforce unique image-label combination', function() {
      expect(() => {
        run(
          'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
          [testImageId, testLabelId, 0.8] // Same image-label combination
        );
      }).to.throw();
    });

    it('should cascade delete when image is deleted', function() {
      // Create a temporary image and annotation
      const tempImageResult = run(
        'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
        ['temp-cascade-test.jpg', 'temp.jpg', 'public/uploads/temp.jpg', 50000, 'image/jpeg']
      );
      const tempImageId = tempImageResult.lastID;

      const tempAnnotationResult = run(
        'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
        [tempImageId, testLabelId, 0.7]
      );
      const tempAnnotationId = tempAnnotationResult.lastID;

      // Verify annotation exists
      let annotation = queryOne('SELECT * FROM annotations WHERE annotation_id = ?', [tempAnnotationId]);
      expect(annotation).to.exist;

      // Delete the image
      run('DELETE FROM images WHERE image_id = ?', [tempImageId]);

      // Verify annotation was cascade deleted
      annotation = queryOne('SELECT * FROM annotations WHERE annotation_id = ?', [tempAnnotationId]);
      expect(annotation).to.be.undefined;
    });

    it('should get annotations with image and label details', function() {
      const annotations = query(`
        SELECT 
          a.*,
          i.filename,
          i.original_name,
          l.label_name,
          l.label_description
        FROM annotations a
        JOIN images i ON a.image_id = i.image_id
        JOIN labels l ON a.label_id = l.label_id
        ORDER BY a.created_at DESC
      `);

      expect(annotations).to.be.an('array');
      expect(annotations.length).to.be.at.least(1);
      
      // Check structure of first annotation
      const firstAnnotation = annotations[0];
      expect(firstAnnotation).to.have.property('annotation_id');
      expect(firstAnnotation).to.have.property('confidence');
      expect(firstAnnotation).to.have.property('filename');
      expect(firstAnnotation).to.have.property('label_name');
    });

    after(function() {
      // Clean up test data
      if (testAnnotationId) {
        run('DELETE FROM annotations WHERE annotation_id = ?', [testAnnotationId]);
      }
      if (testImageId) {
        run('DELETE FROM images WHERE image_id = ?', [testImageId]);
      }
      if (testLabelId) {
        run('DELETE FROM labels WHERE label_id = ?', [testLabelId]);
      }
    });
  });

  describe('Database Indexes', function() {
    it('should have proper indexes for performance', function() {
      const indexes = query(`
        SELECT name, tbl_name, sql 
        FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).to.include.members([
        'idx_annotations_label',
        'idx_annotations_image',
        'idx_images_filename',
        'idx_labels_name'
      ]);
    });
  });

  describe('Complex Queries', function() {
    it('should get images with their labels', function() {
      const imagesWithLabels = query(`
        SELECT 
          i.image_id,
          i.filename,
          GROUP_CONCAT(l.label_name) as labels,
          GROUP_CONCAT(a.confidence) as confidences,
          COUNT(a.annotation_id) as label_count
        FROM images i
        LEFT JOIN annotations a ON i.image_id = a.image_id
        LEFT JOIN labels l ON a.label_id = l.label_id
        GROUP BY i.image_id
        ORDER BY i.uploaded_at DESC
        LIMIT 5
      `);

      expect(imagesWithLabels).to.be.an('array');
      
      imagesWithLabels.forEach(image => {
        expect(image).to.have.property('image_id');
        expect(image).to.have.property('filename');
        expect(image).to.have.property('label_count');
        
        if (image.label_count > 0) {
          expect(image.labels).to.be.a('string');
          expect(image.confidences).to.be.a('string');
        }
      });
    });

    it('should get label usage statistics', function() {
      const labelStats = query(`
        SELECT 
          l.label_id,
          l.label_name,
          COUNT(a.annotation_id) as usage_count,
          AVG(a.confidence) as avg_confidence,
          MIN(a.confidence) as min_confidence,
          MAX(a.confidence) as max_confidence
        FROM labels l
        LEFT JOIN annotations a ON l.label_id = a.label_id
        GROUP BY l.label_id
        ORDER BY usage_count DESC, l.label_name
      `);

      expect(labelStats).to.be.an('array');
      
      labelStats.forEach(stat => {
        expect(stat).to.have.property('label_name');
        expect(stat).to.have.property('usage_count');
        expect(stat.usage_count).to.be.a('number');
        
        if (stat.usage_count > 0) {
          expect(stat.avg_confidence).to.be.a('number');
          expect(stat.avg_confidence).to.be.at.least(0);
          expect(stat.avg_confidence).to.be.at.most(1);
        }
      });
    });

    it('should search images by label', function() {
      const catImages = query(`
        SELECT DISTINCT i.*
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE l.label_name = ?
        ORDER BY i.uploaded_at DESC
      `, ['cat']);

      expect(catImages).to.be.an('array');
      // Should have at least the sample cat image from seed data
      if (catImages.length > 0) {
        catImages.forEach(image => {
          expect(image).to.have.property('image_id');
          expect(image).to.have.property('filename');
        });
      }
    });
  });

  describe('Data Integrity', function() {
    it('should maintain referential integrity', function() {
      // Try to create annotation with non-existent image
      expect(() => {
        run(
          'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
          [99999, 1, 0.5] // Non-existent image_id
        );
      }).to.throw();

      // Try to create annotation with non-existent label
      expect(() => {
        run(
          'INSERT INTO annotations (image_id, label_id, confidence) VALUES (?, ?, ?)',
          [1, 99999, 0.5] // Non-existent label_id
        );
      }).to.throw();
    });

    it('should have consistent data types', function() {
      // Check that all confidence values are within valid range
      const invalidConfidences = query(`
        SELECT * FROM annotations 
        WHERE confidence < 0 OR confidence > 1
      `);
      expect(invalidConfidences).to.have.length(0);

      // Check that all file sizes are positive
      const invalidFileSizes = query(`
        SELECT * FROM images 
        WHERE file_size <= 0
      `);
      expect(invalidFileSizes).to.have.length(0);
    });
  });
});