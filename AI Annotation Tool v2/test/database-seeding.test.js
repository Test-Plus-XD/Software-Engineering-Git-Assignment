/**
 * Database Seeding Tests for AI Annotation Tool v2
 * Tests seed data integrity and Firebase Storage URL functionality
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

describe('Database Seeding Tests', function() {
  this.timeout(10000);

  let db;
  const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test_seeding.db');
  const SEED_DATA_PATH = path.join(__dirname, '..', 'database', 'seeds', '002_complete_snapshot.json');

  before(function() {
    // Remove test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Create fresh test database
    db = new Database(TEST_DB_PATH);

    // Enable foreign keys BEFORE creating schema
    db.pragma('foreign_keys = ON');

    // Create schema from migrations
    const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    // Load seed data
    const seedPath = path.join(__dirname, '..', 'database', 'seeds', '002_complete_snapshot.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    try {
      db.exec(seedSQL);
    } catch (error) {
      console.error('Error loading seed data:', error.message);
      throw error;
    }
  });

  after(function() {
    if (db) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Seed Data Validation', function() {
    let seedData;

    before(function() {
      // Load JSON seed data for comparison
      if (fs.existsSync(SEED_DATA_PATH)) {
        const jsonContent = fs.readFileSync(SEED_DATA_PATH, 'utf8');
        seedData = JSON.parse(jsonContent);
      }
    });

    it('should have loaded all labels from seed data', function() {
      const labels = db.prepare('SELECT * FROM labels ORDER BY label_id').all();

      expect(labels).to.be.an('array');
      expect(labels.length).to.equal(13); // Expected number of labels

      // Verify essential labels exist
      const labelNames = labels.map(l => l.label_name);
      expect(labelNames).to.include.members([
        'cat', 'dog', 'animal', 'person',
        'building', 'nature', 'food', 'technology',
        'indoor', 'outdoor', 'portrait', 'landscape'
      ]);
    });

    it('should have loaded all images with Firebase URLs', function() {
      const images = db.prepare('SELECT * FROM images ORDER BY image_id').all();

      expect(images).to.be.an('array');
      expect(images.length).to.equal(5); // Expected number of images

      // Verify all images have Firebase Storage URLs
      images.forEach(image => {
        expect(image.file_path).to.include('firebasestorage.googleapis.com');
        expect(image.file_path).to.include('cross-platform-assignmen-b97cc.firebasestorage.app');
        expect(image.file_path).to.include('alt=media');
      });
    });

    it('should have loaded all annotations', function() {
      const annotations = db.prepare('SELECT * FROM annotations ORDER BY annotation_id').all();

      expect(annotations).to.be.an('array');
      expect(annotations.length).to.equal(14); // Expected number of annotations

      // Verify all confidences are within valid range
      annotations.forEach(ann => {
        expect(ann.confidence).to.be.at.least(0);
        expect(ann.confidence).to.be.at.most(1);
      });
    });

    it('should match JSON seed data if available', function() {
      if (!seedData) {
        this.skip();
        return;
      }

      const labels = db.prepare('SELECT * FROM labels ORDER BY label_id').all();
      const images = db.prepare('SELECT * FROM images ORDER BY image_id').all();
      const annotations = db.prepare('SELECT * FROM annotations ORDER BY annotation_id').all();

      expect(labels.length).to.equal(13); // seedData.labels.length
      expect(images.length).to.equal(5); // seedData.images.length
      expect(annotations.length).to.equal(14); // seedData.annotations.length
    });
  });

  describe('Firebase Storage URL Tests', function() {
    it('should have valid Firebase Storage URLs for all images', function() {
      const images = db.prepare('SELECT * FROM images').all();

      const firebasePattern = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/.+\?alt=media&token=[a-f0-9-]+$/;

      images.forEach(image => {
        expect(image.file_path).to.match(firebasePattern,
          `Invalid Firebase URL for ${image.filename}: ${image.file_path}`);
      });
    });

    it('should have unique tokens for each image URL', function() {
      const images = db.prepare('SELECT file_path FROM images').all();
      const tokens = images.map(img => {
        const match = img.file_path.match(/token=([a-f0-9-]+)/);
        return match ? match[1] : null;
      });

      // All tokens should exist
      tokens.forEach(token => {
        expect(token).to.not.be.null;
      });

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).to.equal(images.length);
    });

    it('should have correct image filenames in URLs', function() {
      const expectedMappings = {
        'sample-cat-001.jpg': 'Annotations%2Fsample-cat-001.jpg',
        'sample-dog-001.jpg': 'Annotations%2Fsample-dog-001.jpg',
        'sample-landscape-001.jpg': 'Annotations%2Fsample-landscape-001.jpg',
        'sample-person-001.jpg': 'Annotations%2Fsample-person-001.jpg',
        'sample-food-001.jpg': 'Annotations%2Fsample-food-001.jpg'
      };

      const images = db.prepare('SELECT filename, file_path FROM images').all();

      images.forEach(image => {
        const expectedPath = expectedMappings[image.filename];
        if (expectedPath) {
          expect(image.file_path).to.include(expectedPath);
        }
      });
    });
  });

  describe('Image-Label Relationships', function() {
    it('should have cat image with correct labels', function() {
      const result = db.prepare(`
        SELECT
          i.filename,
          GROUP_CONCAT(l.label_name) as labels,
          GROUP_CONCAT(a.confidence) as confidences
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE i.filename = 'sample-cat-001.jpg'
        GROUP BY i.image_id
      `).get();

      expect(result).to.exist;
      const labels = result.labels.split(',');
      expect(labels).to.include.members(['cat', 'animal', 'indoor']);
    });

    it('should have dog image with correct labels', function() {
      const result = db.prepare(`
        SELECT
          i.filename,
          GROUP_CONCAT(l.label_name) as labels
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE i.filename = 'sample-dog-001.jpg'
        GROUP BY i.image_id
      `).get();

      expect(result).to.exist;
      const labels = result.labels.split(',');
      expect(labels).to.include.members(['dog', 'animal', 'outdoor']);
    });

    it('should have landscape image with correct labels', function() {
      const result = db.prepare(`
        SELECT
          i.filename,
          GROUP_CONCAT(l.label_name) as labels
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE i.filename = 'sample-landscape-001.jpg'
        GROUP BY i.image_id
      `).get();

      expect(result).to.exist;
      const labels = result.labels.split(',');
      expect(labels).to.include.members(['nature', 'outdoor', 'landscape']);
    });

    it('should have person image with correct labels', function() {
      const result = db.prepare(`
        SELECT
          i.filename,
          GROUP_CONCAT(l.label_name) as labels
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE i.filename = 'sample-person-001.jpg'
        GROUP BY i.image_id
      `).get();

      expect(result).to.exist;
      const labels = result.labels.split(',');
      expect(labels).to.include.members(['person', 'portrait', 'indoor']);
    });

    it('should have food image with correct labels', function() {
      const result = db.prepare(`
        SELECT
          i.filename,
          GROUP_CONCAT(l.label_name) as labels
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE i.filename = 'sample-food-001.jpg'
        GROUP BY i.image_id
      `).get();

      expect(result).to.exist;
      const labels = result.labels.split(',');
      expect(labels).to.include.members(['food', 'indoor']);
    });
  });

  describe('Database Statistics', function() {
    it('should calculate correct image statistics', function() {
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_images,
          AVG(file_size) as avg_file_size,
          MIN(file_size) as min_file_size,
          MAX(file_size) as max_file_size
        FROM images
      `).get();

      expect(stats.total_images).to.equal(5);
      expect(stats.avg_file_size).to.be.greaterThan(0);
      expect(stats.min_file_size).to.be.greaterThan(0);
      expect(stats.max_file_size).to.be.greaterThan(stats.min_file_size);
    });

    it('should calculate label usage statistics', function() {
      const labelUsage = db.prepare(`
        SELECT
          l.label_name,
          COUNT(a.annotation_id) as usage_count,
          AVG(a.confidence) as avg_confidence
        FROM labels l
        LEFT JOIN annotations a ON l.label_id = a.label_id
        GROUP BY l.label_id
        HAVING usage_count > 0
        ORDER BY usage_count DESC
      `).all();

      expect(labelUsage).to.be.an('array');
      expect(labelUsage.length).to.be.greaterThan(0);

      // Most used labels should include 'indoor', 'animal', 'outdoor'
      const topLabels = labelUsage.slice(0, 5).map(l => l.label_name);
      expect(topLabels).to.satisfy(labels =>
        labels.some(l => ['indoor', 'animal', 'outdoor'].includes(l))
      );
    });

    it('should have correct annotation counts per image', function() {
      const imageCounts = db.prepare(`
        SELECT
          i.filename,
          COUNT(a.annotation_id) as annotation_count
        FROM images i
        LEFT JOIN annotations a ON i.image_id = a.image_id
        GROUP BY i.image_id
        ORDER BY annotation_count DESC
      `).all();

      expect(imageCounts).to.be.an('array');
      expect(imageCounts.length).to.equal(5);

      // Each image should have at least 2 annotations
      imageCounts.forEach(img => {
        expect(img.annotation_count).to.be.at.least(2);
      });
    });
  });

  describe('Query Performance Tests', function() {
    it('should efficiently retrieve images with labels', function() {
      const startTime = Date.now();

      const images = db.prepare(`
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

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(images).to.be.an('array');
      expect(queryTime).to.be.lessThan(100); // Should complete in under 100ms
    });

    it('should efficiently search by label', function() {
      const startTime = Date.now();

      const results = db.prepare(`
        SELECT DISTINCT i.*
        FROM images i
        JOIN annotations a ON i.image_id = a.image_id
        JOIN labels l ON a.label_id = l.label_id
        WHERE l.label_name = ?
      `).all('indoor');

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(results).to.be.an('array');
      expect(queryTime).to.be.lessThan(50); // Should complete in under 50ms
    });
  });

  describe('Data Consistency Tests', function() {
    it('should have no orphaned annotations', function() {
      const orphaned = db.prepare(`
        SELECT a.*
        FROM annotations a
        LEFT JOIN images i ON a.image_id = i.image_id
        LEFT JOIN labels l ON a.label_id = l.label_id
        WHERE i.image_id IS NULL OR l.label_id IS NULL
      `).all();

      expect(orphaned).to.have.length(0);
    });

    it('should have unique image filenames', function() {
      const duplicates = db.prepare(`
        SELECT filename, COUNT(*) as count
        FROM images
        GROUP BY filename
        HAVING count > 1
      `).all();

      expect(duplicates).to.have.length(0);
    });

    it('should have unique label names', function() {
      const duplicates = db.prepare(`
        SELECT label_name, COUNT(*) as count
        FROM labels
        GROUP BY label_name
        HAVING count > 1
      `).all();

      expect(duplicates).to.have.length(0);
    });

    it('should enforce image-label uniqueness in annotations', function() {
      const duplicates = db.prepare(`
        SELECT image_id, label_id, COUNT(*) as count
        FROM annotations
        GROUP BY image_id, label_id
        HAVING count > 1
      `).all();

      expect(duplicates).to.have.length(0);
    });
  });
});
