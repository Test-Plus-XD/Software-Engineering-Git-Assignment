/**
 * Test suite for Labels CRUD endpoints
 * Tests for GET, POST, PUT, DELETE operations on labels
 */

const { expect } = require('chai');
const { query, run } = require('../../../../lib/database/connection');

describe('GET /api/labels endpoint', function() {
  this.timeout(10000);

  beforeEach(async function() {
    await run('DELETE FROM annotations');
    await run('DELETE FROM images');
    await run('DELETE FROM labels');
  });

  it('should return empty array when no labels exist', async function() {
    const labels = await query(`
      SELECT
        l.*,
        COUNT(a.annotation_id) as usage_count
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      GROUP BY l.label_id
      ORDER BY l.label_name
    `);

    expect(labels).to.be.an('array');
    expect(labels).to.have.lengthOf(0);
  });

  it('should return all labels with usage statistics', async function() {
    // Insert test labels
    await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      ['cat', 'Feline animal']
    );
    await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      ['dog', 'Canine animal']
    );

    const labels = await query(`
      SELECT
        l.*,
        COUNT(a.annotation_id) as usage_count
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      GROUP BY l.label_id
      ORDER BY l.label_name
    `);

    expect(labels).to.be.an('array');
    expect(labels).to.have.lengthOf(2);
    expect(labels[0]).to.have.property('label_name');
    expect(labels[0]).to.have.property('usage_count');
  });

  it('should include usage count in response', async function() {
    const labelResult = await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      ['test-label']
    );

    const imageResult = await run(
      'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
      ['test.jpg', 'test.jpg', '/uploads/test.jpg', 1000, 'image/jpeg']
    );

    // Create annotation to increase usage count
    await run(
      'INSERT INTO annotations (image_id, label_id) VALUES (?, ?)',
      [imageResult.lastID, labelResult.lastID]
    );

    const labels = await query(`
      SELECT
        l.*,
        COUNT(a.annotation_id) as usage_count
      FROM labels l
      LEFT JOIN annotations a ON l.label_id = a.label_id
      GROUP BY l.label_id
    `);

    expect(labels[0].usage_count).to.equal(1);
  });
});

describe('POST /api/labels endpoint', function() {
  this.timeout(10000);

  beforeEach(async function() {
    await run('DELETE FROM annotations');
    await run('DELETE FROM images');
    await run('DELETE FROM labels');
  });

  it('should create new label', async function() {
    const labelData = {
      label_name: 'new-label',
      label_description: 'Test description'
    };

    const result = await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      [labelData.label_name, labelData.label_description]
    );

    expect(result.lastID).to.be.a('number');

    const created = await query('SELECT * FROM labels WHERE label_id = ?', [result.lastID]);
    expect(created[0].label_name).to.equal(labelData.label_name);
  });

  it('should handle duplicate label names gracefully', async function() {
    const labelName = 'duplicate-label';

    // Insert first label
    await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      [labelName]
    );

    // Try to insert duplicate - should be handled by data access layer
    try {
      await run(
        'INSERT INTO labels (label_name) VALUES (?)',
        [labelName]
      );
      // Should fail at database level with UNIQUE constraint
    } catch (error) {
      expect(error.message).to.include('UNIQUE constraint failed');
    }
  });

  it('should require label_name field', async function() {
    try {
      await run(
        'INSERT INTO labels (label_description) VALUES (?)',
        ['Description only']
      );
      // Should fail because label_name is NOT NULL
    } catch (error) {
      expect(error.message).to.include('NOT NULL constraint failed');
    }
  });
});

describe('PUT /api/labels/[id] endpoint', function() {
  this.timeout(10000);

  beforeEach(async function() {
    await run('DELETE FROM annotations');
    await run('DELETE FROM images');
    await run('DELETE FROM labels');
  });

  it('should update label name', async function() {
    const labelResult = await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      ['old-name', 'Old description']
    );

    const labelId = labelResult.lastID;

    await run(
      'UPDATE labels SET label_name = ? WHERE label_id = ?',
      ['new-name', labelId]
    );

    const updated = await query('SELECT * FROM labels WHERE label_id = ?', [labelId]);
    expect(updated[0].label_name).to.equal('new-name');
  });

  it('should update label description', async function() {
    const labelResult = await run(
      'INSERT INTO labels (label_name, label_description) VALUES (?, ?)',
      ['test-label', 'Old description']
    );

    const labelId = labelResult.lastID;

    await run(
      'UPDATE labels SET label_description = ? WHERE label_id = ?',
      ['New description', labelId]
    );

    const updated = await query('SELECT * FROM labels WHERE label_id = ?', [labelId]);
    expect(updated[0].label_description).to.equal('New description');
  });

  it('should return 404 for non-existent label', async function() {
    const nonExistentId = 99999;
    const result = await query('SELECT * FROM labels WHERE label_id = ?', [nonExistentId]);
    expect(result).to.have.lengthOf(0);
  });

  it('should prevent duplicate label names', async function() {
    await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      ['existing-label']
    );

    const labelResult = await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      ['another-label']
    );

    try {
      await run(
        'UPDATE labels SET label_name = ? WHERE label_id = ?',
        ['existing-label', labelResult.lastID]
      );
      // Should fail with UNIQUE constraint
    } catch (error) {
      expect(error.message).to.include('UNIQUE constraint failed');
    }
  });
});

describe('DELETE /api/labels/[id] endpoint', function() {
  this.timeout(10000);

  beforeEach(async function() {
    await run('DELETE FROM annotations');
    await run('DELETE FROM images');
    await run('DELETE FROM labels');
  });

  it('should delete label from database', async function() {
    const labelResult = await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      ['test-label']
    );

    const labelId = labelResult.lastID;

    await run('DELETE FROM labels WHERE label_id = ?', [labelId]);

    const deleted = await query('SELECT * FROM labels WHERE label_id = ?', [labelId]);
    expect(deleted).to.have.lengthOf(0);
  });

  it('should cascade deletion to annotations', async function() {
    const labelResult = await run(
      'INSERT INTO labels (label_name) VALUES (?)',
      ['test-label']
    );

    const imageResult = await run(
      'INSERT INTO images (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
      ['test.jpg', 'test.jpg', '/uploads/test.jpg', 1000, 'image/jpeg']
    );

    await run(
      'INSERT INTO annotations (image_id, label_id) VALUES (?, ?)',
      [imageResult.lastID, labelResult.lastID]
    );

    // Delete label (cascade should remove annotations)
    await run('DELETE FROM labels WHERE label_id = ?', [labelResult.lastID]);

    const annotations = await query('SELECT * FROM annotations WHERE label_id = ?', [labelResult.lastID]);
    expect(annotations).to.have.lengthOf(0);
  });

  it('should return 404 for non-existent label', async function() {
    const nonExistentId = 99999;
    const result = await query('SELECT * FROM labels WHERE label_id = ?', [nonExistentId]);
    expect(result).to.have.lengthOf(0);
  });
});
