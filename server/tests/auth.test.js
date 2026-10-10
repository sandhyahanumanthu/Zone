import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

dotenv.config();

const app = createApp();

test('Authentication Flow Integration Tests', async (t) => {
  // Connect to test database
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dropzone';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri);
  }

  const testEmail = `auth_test_${Date.now()}@dropzone.local`;
  const testPassword = 'Password123!Secure';
  let authCookie = null;
  let authToken = null;

  await t.test('1. Registration fails when required fields or short password are provided', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A', // too short
        email: 'invalid-email',
        password: '123', // too short
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Validation failed');
  });

  await t.test('2. Successful registration creates user, hashes password, and sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Auth Test User',
        email: testEmail,
        password: testPassword,
        bio: 'Automated test suite user',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.passwordHash, undefined, 'passwordHash must never be returned in API response');
    assert.ok(res.body.token);

    // Verify Set-Cookie header contains HttpOnly token
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    assert.ok(tokenCookie);
    assert.match(tokenCookie, /HttpOnly/i);

    authCookie = tokenCookie;
    authToken = res.body.token;

    // Verify password is truly hashed in database and NOT plain text
    const dbUser = await User.findOne({ email: testEmail }).select('+passwordHash');
    assert.ok(dbUser);
    assert.notEqual(dbUser.passwordHash, testPassword);
    assert.match(dbUser.passwordHash, /^\$2[aby]\$/);
  });

  await t.test('3. Duplicate registration is rejected with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: testEmail,
        password: testPassword,
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /already exists/i);
  });

  await t.test('4. Login fails with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Invalid email address or password/);
  });

  await t.test('5. Login fails with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ghost_nonexistent_user@dropzone.local',
        password: testPassword,
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('6. Successful login returns user and sets fresh HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.passwordHash, undefined);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    assert.ok(tokenCookie);
    authCookie = tokenCookie;
  });

  await t.test('7. Protected route /api/auth/me rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('8. Protected route /api/auth/me allows access with HttpOnly cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  await t.test('9. Protected route /api/auth/me allows access with Authorization Bearer header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail);
  });

  await t.test('10. Protected route PUT /api/auth/me updates user profile', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie)
      .send({
        name: 'Updated Name Tester',
        bio: 'Updated bio information from test',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.name, 'Updated Name Tester');
    assert.equal(res.body.user.bio, 'Updated bio information from test');
  });

  await t.test('11. Logout endpoint /api/auth/logout clears auth cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    // Verifies cookie is cleared (e.g. expires in past or empty)
    const tokenCookie = cookies.find((c) => c.startsWith('token=;'));
    assert.ok(tokenCookie);
  });

  // Clean up test user and close connection so test process exits cleanly
  await User.deleteOne({ email: testEmail });
  await mongoose.connection.close();
});
