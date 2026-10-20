import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('--- Initializing Database Schema ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);

    // Apply safe column migrations for existing instances
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'researcher';
      ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS invite_code VARCHAR(64) UNIQUE DEFAULT md5(random()::text);
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS scope VARCHAR(30) DEFAULT 'community';
    `);
    console.log('✓ Tables, columns, and triggers created/verified successfully.');

    console.log('--- Applying Performance Indexes ---');
    const indexesSql = fs.readFileSync(path.join(__dirname, 'indexes.sql'), 'utf-8');
    await client.query(indexesSql);
    console.log('✓ Indexes applied successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
