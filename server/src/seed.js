import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Zone } from './models/Zone.js';
import { Need } from './models/Need.js';
import { Offer } from './models/Offer.js';
import { EventMembership } from './models/EventMembership.js';
import { connectDB, closeDatabase } from './config/db.js';

dotenv.config();

export async function seedDatabase() {
  console.log('--- Seeding DropZone Database ---');
  await connectDB();

  try {
    // 1. Create or Find Hackathon Event Zone
    let zone = await Zone.findOne({ name: 'Global Hackathon Arena 2026' });
    if (!zone) {
      zone = await Zone.create({
        name: 'Global Hackathon Arena 2026',
        description: 'Main auditorium & builder bays for 48-hour SAMARTHA Hackathon. Connect local needs to real action.',
        type: 'hackathon',
        centerLatitude: 12.9716, // Bangalore coordinates
        centerLongitude: 77.5946,
        radiusMeters: 500,
        venueName: 'Lendi Institute of Engineering and Technology',
        venueAddress: 'Jonnada, Denkada Mandal, Vizianagaram, Andhra Pradesh 535005',
        boundaryType: 'radius',
        isVirtual: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 48 * 3600000),
        joinCode: 'SAMARTHA2026',
        isPublic: true,
        announcements: [
          {
            title: 'Welcome to SAMARTHA Hackathon 2026!',
            content: 'Where Indian Ingenuity Meets AI. Use DropZone to find skills, form teams, and debug project hurdles in real-time.',
            authorName: 'Priya Sharma (Organizer)',
            createdAt: new Date(),
          },
          {
            title: 'Mentorship Window Open',
            content: 'AI and Systems mentors are active in Pod C. Broadcast your needs through DropZone for instant peer matching.',
            authorName: 'Hackathon Organizing Team',
            createdAt: new Date(Date.now() - 30 * 60000),
          },
        ],
        isActive: true,
      });
      console.log(`[Seed] Created event zone: ${zone.name} (${zone._id})`);
    } else {
      if (!zone.venueName) {
        zone.venueName = 'Lendi Institute of Engineering and Technology';
        zone.venueAddress = 'Jonnada, Denkada Mandal, Vizianagaram, Andhra Pradesh 535005';
        zone.boundaryType = 'radius';
        zone.isVirtual = false;
        await zone.save();
      }
      console.log(`[Seed] Found existing event zone: ${zone.name}`);
    }

    const defaultPasswordHash = await bcrypt.hash('Password123!Secure', 10);

    // 2. Create Users
    const usersToCreate = [
      {
        name: 'Priya Sharma (Lead Organizer)',
        email: 'organizer@dropzone.local',
        passwordHash: defaultPasswordHash,
        role: 'organizer',
        bio: 'SAMARTHA Hackathon Organizing Lead. Building privacy-first campus infrastructure.',
        skills: ['Event Operations', 'Team Formation'],
      },
      {
        name: 'Rahul Verma (AI & Backend)',
        email: 'rahul@dropzone.local',
        passwordHash: defaultPasswordHash,
        role: 'user',
        bio: 'FastAPI, PyTorch & Node builder. Available for debugging async backends.',
        skills: ['Python', 'FastAPI', 'MongoDB', 'Docker', 'React'],
      },
      {
        name: 'Ananya Iyer (Frontend & UI/UX)',
        email: 'ananya@dropzone.local',
        passwordHash: defaultPasswordHash,
        role: 'user',
        bio: 'Crafting high-speed interfaces with React 19, Tailwind CSS and Figma.',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'UI/UX Design'],
      },
      {
        name: 'Vikram Das (Builder)',
        email: 'vikram@dropzone.local',
        passwordHash: defaultPasswordHash,
        role: 'user',
        bio: 'Building an edge AI monitor for agricultural sensors.',
        skills: ['Python', 'Embedded', 'IoT'],
      },
      {
        name: 'Campus Safety Moderator',
        email: 'moderator@dropzone.local',
        passwordHash: defaultPasswordHash,
        role: 'moderator',
        bio: 'Event safety officer ensuring respectful, verified community interactions.',
        skills: ['Community Safety'],
      },
    ];

    const seededUsers = {};
    for (const u of usersToCreate) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
        console.log(`[Seed] Created user: ${existing.name} (${existing.email})`);
      }
      seededUsers[u.email] = existing;

      // Ensure membership in the event
      await EventMembership.findOneAndUpdate(
        { userId: existing._id, zoneId: zone._id },
        {
          userId: existing._id,
          zoneId: zone._id,
          role: existing.role === 'organizer' ? 'organizer' : 'participant',
          status: 'active',
        },
        { upsert: true }
      );
    }

    // 3. Create Active Helper Offers
    const rahul = seededUsers['rahul@dropzone.local'];
    const ananya = seededUsers['ananya@dropzone.local'];

    await Offer.findOneAndUpdate(
      { helperId: rahul._id, zoneId: zone._id },
      {
        helperId: rahul._id,
        zoneId: zone._id,
        skills: ['Python', 'FastAPI', 'MongoDB', 'Docker'],
        availabilityMinutes: 180, // 3 hours available
        preferredCategories: ['Coding & Debugging', 'Technical Help'],
        maxConcurrentTasks: 2,
        activeTaskCount: 0,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 12 * 3600000),
      },
      { upsert: true }
    );

    await Offer.findOneAndUpdate(
      { helperId: ananya._id, zoneId: zone._id },
      {
        helperId: ananya._id,
        zoneId: zone._id,
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'UI/UX Design'],
        availabilityMinutes: 120, // 2 hours available
        preferredCategories: ['UI/UX Design', 'Coding & Debugging'],
        maxConcurrentTasks: 1,
        activeTaskCount: 0,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 12 * 3600000),
      },
      { upsert: true }
    );
    console.log('[Seed] Created active helper offers for Rahul and Ananya.');

    // 4. Create an Initial Sample Need
    const vikram = seededUsers['vikram@dropzone.local'];
    let sampleNeed = await Need.findOne({ requesterId: vikram._id, zoneId: zone._id, status: 'OPEN' });
    if (!sampleNeed) {
      sampleNeed = await Need.create({
        requesterId: vikram._id,
        zoneId: zone._id,
        title: 'Need Python & FastAPI expert to resolve async MongoDB connection timeout',
        description: 'Our sensor ingestion pipeline is crashing when handling concurrent telemetry payloads. Need an experienced Python developer for about 1 hour to optimize connection pooling.',
        category: 'Coding & Debugging',
        requiredSkills: ['Python', 'FastAPI', 'MongoDB'],
        estimatedDurationMinutes: 60,
        urgency: 'urgent',
        expiresAt: new Date(Date.now() + 6 * 3600000),
        visibility: 'members_only',
        status: 'OPEN',
      });
      console.log(`[Seed] Created sample open need: "${sampleNeed.title}"`);
    }

    console.log('--- Database Seeding Complete ---');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  } finally {
    await closeDatabase();
  }
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
