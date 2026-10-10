import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Zone } from '../src/models/Zone.js';
import { Need } from '../src/models/Need.js';
import { Offer } from '../src/models/Offer.js';
import { Collaboration } from '../src/models/Collaboration.js';
import { Report } from '../src/models/Report.js';

dotenv.config();

const app = createApp();

test('Need-to-Action End-to-End Workflow Integration Tests', async (t) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dropzone';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri);
  }

  // 1. Fetch test zone created by seed
  const zone = await Zone.findOne({ name: 'Global Hackathon Arena 2026' });
  assert.ok(zone, 'Global Hackathon Arena zone must exist in DB');

  // Log in as Vikram (Requester)
  const loginResVikram = await request(app).post('/api/auth/login').send({
    email: 'vikram@dropzone.local',
    password: 'Password123!Secure',
  });
  assert.equal(loginResVikram.status, 200);
  const vikramCookie = loginResVikram.headers['set-cookie'].find((c) => c.startsWith('token='));
  assert.ok(vikramCookie);

  // Log in as Rahul (Helper)
  const loginResRahul = await request(app).post('/api/auth/login').send({
    email: 'rahul@dropzone.local',
    password: 'Password123!Secure',
  });
  assert.equal(loginResRahul.status, 200);
  const rahulCookie = loginResRahul.headers['set-cookie'].find((c) => c.startsWith('token='));
  assert.ok(rahulCookie);

  // Log in as Moderator
  const loginResMod = await request(app).post('/api/auth/login').send({
    email: 'moderator@dropzone.local',
    password: 'Password123!Secure',
  });
  assert.equal(loginResMod.status, 200);
  const modCookie = loginResMod.headers['set-cookie'].find((c) => c.startsWith('token='));
  assert.ok(modCookie);

  // Log in as Organizer
  const loginResOrg = await request(app).post('/api/auth/login').send({
    email: 'organizer@dropzone.local',
    password: 'Password123!Secure',
  });
  assert.equal(loginResOrg.status, 200);
  const orgCookie = loginResOrg.headers['set-cookie'].find((c) => c.startsWith('token='));
  assert.ok(orgCookie);

  let createdNeedId = null;
  let rahulOfferId = null;
  let createdCollabId = null;

  await t.test('1. AI-assisted draft extraction parses natural language voice text', async () => {
    const res = await request(app)
      .post('/api/needs/extract-draft')
      .set('Cookie', vikramCookie)
      .send({
        text: 'Hey, I need a Python and FastAPI developer for about 90 mins to debug our MongoDB database crash urgent!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.requiredSkills.includes('Python'));
    assert.ok(res.body.data.requiredSkills.includes('Fastapi'));
    assert.equal(res.body.data.estimatedDurationMinutes, 90);
    assert.equal(res.body.data.urgency, 'urgent');
    assert.equal(res.body.data.category, 'Coding & Debugging');
  });

  await t.test('2. Requester creates structured Need in event zone', async () => {
    const res = await request(app)
      .post('/api/needs')
      .set('Cookie', vikramCookie)
      .send({
        zoneId: zone._id.toString(),
        title: 'Need PyTorch & FastAPI dev for sensor anomaly detector',
        description: 'Need assistance fixing async tensor batching before the midnight hackathon milestone.',
        category: 'Coding & Debugging',
        requiredSkills: ['Python', 'FastAPI'],
        estimatedDurationMinutes: 60,
        urgency: 'urgent',
        expiryHours: 4,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'OPEN');
    createdNeedId = res.body.data._id;
  });

  await t.test('3. Fetch active helper offer for Rahul', async () => {
    const res = await request(app)
      .get('/api/offers/my')
      .set('Cookie', rahulCookie);

    assert.equal(res.status, 200);
    assert.ok(res.body.data);
    assert.ok(res.body.data.skills.includes('Python'));
    rahulOfferId = res.body.data._id;
  });

  await t.test('4. Explainable matching engine computes score and auditable reasons', async () => {
    const res = await request(app)
      .get(`/api/matches/needs/${createdNeedId}`)
      .set('Cookie', vikramCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.count >= 1);

    const topMatch = res.body.data[0];
    assert.ok(topMatch.score >= 80, `Expected score >= 80, got ${topMatch.score}`);
    assert.ok(topMatch.reasons.length >= 2, 'Must provide multiple explainable reasons');
    assert.equal(topMatch.availabilityConflict, false);
    assert.equal(topMatch.eligibilityStatus, 'eligible');
  });

  await t.test('5. Bilateral match acceptance initializes Collaboration Room and updates status to IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`/api/matches/needs/${createdNeedId}/accept`)
      .set('Cookie', vikramCookie)
      .send({
        offerId: rahulOfferId,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.collaborationId);
    assert.equal(res.body.data.need.status, 'IN_PROGRESS');

    createdCollabId = res.body.data.collaborationId;
  });

  await t.test('6. Room participants can post task notes in Collaboration workspace', async () => {
    const res = await request(app)
      .post(`/api/collaborations/${createdCollabId}/notes`)
      .set('Cookie', rahulCookie)
      .send({
        text: 'Joined table Pod B! Pulling your git branch now to inspect the CORS and tensor batching.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.data.text, /Joined table Pod B/);
  });

  await t.test('7. Unauthorized user cannot access private collaboration room (Security Negative Test)', async () => {
    // Moderator is not a participant in this room
    const res = await request(app)
      .get(`/api/collaborations/${createdCollabId}`)
      .set('Cookie', modCookie);

    // If moderator is not an organizer or participant, verify rejection (or organizer access)
    const unauthorizedUserRes = await request(app)
      .post(`/api/collaborations/${createdCollabId}/notes`)
      .set('Cookie', modCookie)
      .send({ text: 'Spy note from third party' });

    assert.equal(unauthorizedUserRes.status, 403);
    assert.equal(unauthorizedUserRes.body.success, false);
  });

  await t.test('8. Requester marks task as RESOLVED and closes collaboration', async () => {
    const res = await request(app)
      .patch(`/api/collaborations/${createdCollabId}/resolve`)
      .set('Cookie', vikramCookie)
      .send({
        summaryOutcome: 'Bug fixed! Connection pool optimized and tensor batching running smoothly.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'RESOLVED');

    // Verify Need status in DB also transitioned to RESOLVED
    const dbNeed = await Need.findById(createdNeedId);
    assert.equal(dbNeed.status, 'RESOLVED');
    assert.ok(dbNeed.resolvedAt);
  });

  await t.test('9. Report submission reaches Moderator Queue with proper review workflow', async () => {
    // 9a. Submit report
    const reportRes = await request(app)
      .post('/api/moderation/reports')
      .set('Cookie', rahulCookie)
      .send({
        targetType: 'need',
        targetId: createdNeedId,
        reason: 'Testing safety reporting system during integration tests',
      });

    assert.equal(reportRes.status, 201);
    const reportId = reportRes.body.data._id;

    // 9b. Moderator views queue
    const queueRes = await request(app)
      .get('/api/moderation/queue')
      .set('Cookie', modCookie);

    assert.equal(queueRes.status, 200);
    assert.ok(queueRes.body.data.some((r) => r._id === reportId));

    // 9c. Moderator applies verdict
    const verdictRes = await request(app)
      .patch(`/api/moderation/reports/${reportId}`)
      .set('Cookie', modCookie)
      .send({
        status: 'reviewed',
        actionTaken: 'none',
        moderatorNotes: 'Verified benign test report.',
      });

    assert.equal(verdictRes.status, 200);
    assert.equal(verdictRes.body.data.report.status, 'reviewed');
  });

  await t.test('10. Event Analytics aggregates real database metrics', async () => {
    const res = await request(app).get(`/api/analytics/events/${zone._id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totalNeeds >= 1);
    assert.ok(res.body.data.resolvedNeeds >= 1);
    assert.ok(res.body.data.matchAcceptanceRate > 0);
  });

  await t.test('11. Organizer can configure zone location and venue parameters', async () => {
    const locRes = await request(app)
      .patch(`/api/zones/${zone._id}/location`)
      .set('Cookie', orgCookie)
      .send({
        venueName: 'Lendi Institute of Engineering and Technology',
        venueAddress: 'Jonnada, Denkada Mandal, Vizianagaram, Andhra Pradesh 535005',
        boundaryType: 'radius',
        radiusMeters: 450,
      });

    assert.equal(locRes.status, 200);
    assert.equal(locRes.body.success, true);
    assert.equal(locRes.body.data.venueName, 'Lendi Institute of Engineering and Technology');
    assert.equal(locRes.body.data.boundaryType, 'radius');

    // Negative: Normal user cannot configure zone location
    const unauthRes = await request(app)
      .patch(`/api/zones/${zone._id}/location`)
      .set('Cookie', rahulCookie)
      .send({ venueName: 'Hacked Venue' });

    assert.equal(unauthRes.status, 403);
  });

  await t.test('12. Lost & Found resolution transitions status with clear Item Found message', async () => {
    // Create a Lost & Found item
    const lostRes = await request(app)
      .post('/api/needs')
      .set('Cookie', vikramCookie)
      .send({
        zoneId: zone._id.toString(),
        title: 'Lost blue Lenovo ThinkPad charger in Lab 3',
        description: '65W USB-C brick left near row 4. Please contact if found.',
        category: 'Lost & Found',
        requiredSkills: [],
        estimatedDurationMinutes: 30,
        urgency: 'urgent',
        expiryHours: 12,
      });

    assert.equal(lostRes.status, 201);
    const lostNeedId = lostRes.body.data._id;

    // Resolve as found
    const resolveRes = await request(app)
      .patch(`/api/needs/${lostNeedId}/resolve`)
      .set('Cookie', vikramCookie)
      .send({ resolutionNotes: 'Retrieved from lab manager desk' });

    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.body.data.status, 'RESOLVED');
    assert.match(resolveRes.body.message, /Item Found/);

    // Negative: getMatches on resolved item rejects with clear status
    const matchRes = await request(app)
      .get(`/api/matches/needs/${lostNeedId}`)
      .set('Cookie', vikramCookie);

    assert.equal(matchRes.status, 400);
    assert.match(matchRes.body.error, /Item Found/);

    await Need.deleteOne({ _id: lostNeedId });
  });

  await t.test('13. Stale or resolved need rejects match acceptance with 409 Conflict', async () => {
    // Attempt to accept match on already resolved need (createdNeedId was resolved in test 8)
    const staleAcceptRes = await request(app)
      .post(`/api/matches/needs/${createdNeedId}/accept`)
      .set('Cookie', vikramCookie)
      .send({ offerId: rahulOfferId });

    assert.equal(staleAcceptRes.status, 409);
    assert.match(staleAcceptRes.body.error, /Resolved/);
  });

  await t.test('14. Helper offer at maximum concurrent tasks is excluded from active offers', async () => {
    // Set rahulOffer activeTaskCount equal to maxConcurrentTasks (max is 2)
    await Offer.findByIdAndUpdate(rahulOfferId, { activeTaskCount: 2, maxConcurrentTasks: 2 });

    const offersRes = await request(app).get(`/api/offers?zoneId=${zone._id}`);
    assert.equal(offersRes.status, 200);
    // Rahul should NOT be in available helpers list because he is at max capacity
    const hasRahul = offersRes.body.data.some((o) => o._id.toString() === rahulOfferId.toString());
    assert.equal(hasRahul, false, 'Full capacity offer should be excluded from active helper list');

    // Restore Rahul capacity
    await Offer.findByIdAndUpdate(rahulOfferId, { activeTaskCount: 0 });
  });

  // Teardown: Clean up created test items and close connection
  await Need.deleteOne({ _id: createdNeedId });
  await Collaboration.deleteOne({ _id: createdCollabId });
  await mongoose.connection.close();
});
