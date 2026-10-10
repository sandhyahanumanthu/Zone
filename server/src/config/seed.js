import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Zone } from '../models/Zone.js';
import { Post } from '../models/Post.js';
import { Report } from '../models/Report.js';
import { Block } from '../models/Block.js';

dotenv.config();

export async function seedDevelopmentDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dropzone';

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri);
  }

  console.log('[DropZone DB Verification] Connected to MongoDB for verification & seeding.');

  // Check Zone collection
  const existingZoneCount = await Zone.countDocuments();
  let defaultZone;

  if (existingZoneCount === 0) {
    console.log('[DropZone DB] Populating initial safe development zones...');
    const zones = await Zone.insertMany([
      {
        name: 'Tech Campus Innovation Hub',
        description: 'Central engineering quad, incubator lab, and main student union collaboration area.',
        type: 'campus',
        centerLatitude: 37.7749,
        centerLongitude: -122.4194,
        radiusMeters: 450,
        isActive: true,
      },
      {
        name: 'Global Hackathon Arena 2026',
        description: 'Main auditorium and hack room for 48-hour builder marathon. Find team members & mentors.',
        type: 'hackathon',
        centerLatitude: 37.7833,
        centerLongitude: -122.4167,
        radiusMeters: 300,
        isActive: true,
      },
      {
        name: 'Downtown Civic Concourse',
        description: 'Metro exchange plaza, food truck court, and pedestrian public square.',
        type: 'transit',
        centerLatitude: 37.7891,
        centerLongitude: -122.4014,
        radiusMeters: 600,
        isActive: true,
      },
      {
        name: 'Summer Open Air Music Fest',
        description: 'Stage zones, water stations, lost items desk, and attendee meetups at South Park.',
        type: 'event',
        centerLatitude: 37.7819,
        centerLongitude: -122.3934,
        radiusMeters: 750,
        isActive: true,
      },
      {
        name: 'Mission Tech Co-Working Collective',
        description: 'Neighborhood cafe strip and shared community workspaces for remote workers.',
        type: 'community',
        centerLatitude: 37.7599,
        centerLongitude: -122.4148,
        radiusMeters: 500,
        isActive: true,
      },
    ]);
    defaultZone = zones[0];
    console.log(`[DropZone DB] Successfully seeded ${zones.length} development zones.`);
  } else {
    defaultZone = await Zone.findOne({ isActive: true });
    console.log(`[DropZone DB] Existing zones found (${existingZoneCount} zones in collection).`);
  }

  // Check User collection
  let defaultUser = await User.findOne({ email: 'developer@dropzone.local' });
  if (!defaultUser) {
    defaultUser = await User.create({
      name: 'Elena Rostova',
      email: 'developer@dropzone.local',
      passwordHash: '$2b$10$developmenthashplaceholderneverinproduction123',
      role: 'moderator',
      bio: 'Distributed systems student & privacy researcher in San Francisco.',
      isActive: true,
    });
    console.log('[DropZone DB] Created verified sample user (passwordHash excluded from queries).');
  }

  // Check Post collection
  const existingPostCount = await Post.countDocuments();
  if (existingPostCount === 0 && defaultZone && defaultUser) {
    const posts = await Post.insertMany([
      {
        authorId: defaultUser._id,
        zoneId: defaultZone._id,
        title: 'Found Blue Hydro Flask in 3rd Floor CS Lab',
        content: 'Left on table 4 next to the 3D printer. Handed it to the lab assistant desk. Has a NASA sticker on the side.',
        category: 'Lost & Found',
        expiresAt: new Date(Date.now() + 18 * 3600000),
        moderationStatus: 'approved',
      },
      {
        authorId: defaultUser._id,
        zoneId: defaultZone._id,
        title: 'Need 1 Frontend Engineer (Tailwind/React) for Smart Grid project',
        content: 'We are building an offline-first mesh protocol visualizer. Have 2 backend/firmware devs ready. Sitting in Pod B, table 12!',
        category: 'Team Up',
        expiresAt: new Date(Date.now() + 8 * 3600000),
        moderationStatus: 'approved',
      },
      {
        authorId: defaultUser._id,
        zoneId: defaultZone._id,
        title: 'Operating Systems Midterm Review Group - Room 204 at 6 PM',
        content: 'Going over virtual memory paging, scheduling algorithms, and past exam questions. Whiteboards available.',
        category: 'Study Groups',
        expiresAt: new Date(Date.now() + 6 * 3600000),
        moderationStatus: 'approved',
      },
    ]);
    console.log(`[DropZone DB] Successfully seeded ${posts.length} initial active posts.`);
  }

  return { defaultZone, defaultUser };
}

// Direct execution test
if (process.argv[1]?.endsWith('seed.js')) {
  seedDevelopmentDatabase()
    .then(async () => {
      console.log('[DropZone DB] Verification and seeding completed successfully.');
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DropZone DB] Verification error:', err);
      process.exit(1);
    });
}
