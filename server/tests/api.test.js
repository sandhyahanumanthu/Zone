import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Post } from '../src/models/Post.js';
import { Zone } from '../src/models/Zone.js';
import { Block } from '../src/models/Block.js';
import { Report } from '../src/models/Report.js';

const app = createApp();

test('Server root endpoint returns 200 with service info', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'DropZone API');
  assert.equal(res.body.status, 'running');
});

test('Health endpoint reflects real database status (503 when disconnected)', async () => {
  // Mongoose is disconnected in this test environment
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.service, 'DropZone API');
  assert.equal(res.body.database, 'disconnected');
  assert.equal(res.body.status, 'unhealthy');
});

test('Unknown routes return standardized 404 response', async () => {
  const res = await request(app).get('/api/random-unknown-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /Route not found/);
});

test('Invalid MongoDB ObjectId parameter returns 400 validation error', async () => {
  const res = await request(app).get('/api/zones/invalid-id-123');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Validation failed');
  assert.equal(res.body.details[0].field, 'id');
  assert.match(res.body.details[0].message, /Invalid MongoDB ObjectId/);
});

test('Invalid user profile ObjectId returns 400 validation error', async () => {
  const res = await request(app).get('/api/users/not-an-objectid');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Validation failed');
});

test('Invalid pagination inputs return 400 validation errors', async () => {
  // Test negative page
  const resNegative = await request(app).get('/api/posts?page=-2');
  assert.equal(resNegative.status, 400);
  assert.equal(resNegative.body.success, false);

  // Test limit exceeding maximum of 50
  const resLimit = await request(app).get('/api/posts?limit=100');
  assert.equal(resLimit.status, 400);
  assert.equal(resLimit.body.success, false);
  assert.match(resLimit.body.details[0].message, /Limit cannot exceed 50/);
});

test('Database unavailable behavior handles requests gracefully without crashing', async () => {
  // When DB is disconnected, GET /api/zones returns 503 rather than throwing an unhandled exception
  const res = await request(app).get('/api/zones');
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /Database is disconnected/);
});

test('User model never returns passwordHash in toJSON output', () => {
  const user = new User({
    name: 'Privacy Advocate',
    email: 'advocate@dropzone.local',
    passwordHash: '$2b$10$supersecretneverleakme1234567890',
    role: 'user',
    bio: 'Building privacy-first communities',
  });

  const json = user.toJSON();
  assert.equal(json.name, 'Privacy Advocate');
  assert.equal(json.email, 'advocate@dropzone.local');
  assert.equal(json.passwordHash, undefined, 'passwordHash must never be present in serialized JSON');
  assert.equal(json.__v, undefined);
});

test('Zone model validates coordinate ranges and radius constraints', () => {
  // Test invalid latitude (> 90)
  const invalidZone = new Zone({
    name: 'Invalid Zone',
    description: 'Out of bounds coordinates',
    type: 'campus',
    centerLatitude: 105, // Invalid
    centerLongitude: 20,
    radiusMeters: 500,
  });

  const validationError = invalidZone.validateSync();
  assert.ok(validationError, 'Zone should fail validation for out of bounds latitude');
  assert.ok(validationError.errors.centerLatitude);
});

test('Post model validates required fields and future expiry date', () => {
  const pastDate = new Date(Date.now() - 3600000);
  const invalidPost = new Post({
    authorId: new mongoose.Types.ObjectId(),
    zoneId: new mongoose.Types.ObjectId(),
    title: 'Expired on creation',
    content: 'This post is already expired',
    category: 'Events',
    expiresAt: pastDate,
  });

  const error = invalidPost.validateSync();
  assert.ok(error, 'Post should fail validation for past expiry date');
  assert.ok(error.errors.expiresAt);
});

test('Block model and Report model schemas instantiate with correct definitions', () => {
  const blockerId = new mongoose.Types.ObjectId();
  const blockedUserId = new mongoose.Types.ObjectId();
  const block = new Block({ blockerId, blockedUserId });
  assert.equal(block.blockerId.toString(), blockerId.toString());

  const report = new Report({
    reporterId: blockerId,
    targetType: 'post',
    targetId: new mongoose.Types.ObjectId(),
    reason: 'Inappropriate content violating community guidelines',
  });
  assert.equal(report.status, 'pending');
});
