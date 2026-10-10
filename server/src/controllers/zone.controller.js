import mongoose from 'mongoose';
import { Zone } from '../models/Zone.js';
import { EventMembership } from '../models/EventMembership.js';

export async function getZones(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database is disconnected. Cannot retrieve zones.',
      });
    }

    const { type } = req.query;
    const filter = { isActive: true };

    if (type && type !== 'all') {
      filter.type = type;
    }

    const zones = await Zone.find(filter).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (err) {
    next(err);
  }
}

export async function getZoneById(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database is disconnected. Cannot retrieve zone.',
      });
    }

    const { id } = req.params;
    const zone = await Zone.findOne({ _id: id, isActive: true }).lean();

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found or inactive',
      });
    }

    res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (err) {
    next(err);
  }
}

export async function joinZone(req, res, next) {
  try {
    const { id } = req.params;
    const { joinCode } = req.body || {};
    const userId = req.user._id;

    const zone = await Zone.findOne({ _id: id, isActive: true });
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Event zone not found',
      });
    }

    // If joinCode provided, verify it (or permit if matches or public)
    if (zone.joinCode && joinCode && zone.joinCode !== joinCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event join code',
      });
    }

    const membership = await EventMembership.findOneAndUpdate(
      { userId, zoneId: id },
      {
        userId,
        zoneId: id,
        role: req.user.role === 'organizer' ? 'organizer' : 'participant',
        status: 'active',
        joinedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully joined ${zone.name}`,
      data: {
        membership,
        zone,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function addAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const zone = await Zone.findById(id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Event zone not found',
      });
    }

    // Organizer or moderator check
    if (req.user.role !== 'organizer' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only organizers can publish official announcements',
      });
    }

    const announcement = {
      title,
      content,
      authorName: req.user.name,
      createdAt: new Date(),
    };

    zone.announcements.unshift(announcement);
    await zone.save();

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted to zone',
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateZoneLocation(req, res, next) {
  try {
    const { id } = req.params;
    const {
      venueName,
      venueAddress,
      centerLatitude,
      centerLongitude,
      radiusMeters,
      isVirtual,
      boundaryType,
    } = req.body;

    const zone = await Zone.findById(id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Event zone not found',
      });
    }

    const isOrganizer = req.user.role === 'organizer' || req.user.role === 'moderator';
    const isZoneCreator = zone.organizerId && zone.organizerId.toString() === req.user._id.toString();

    if (!isOrganizer && !isZoneCreator) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized event organizers can configure zone location details',
      });
    }

    if (venueName !== undefined) zone.venueName = venueName;
    if (venueAddress !== undefined) zone.venueAddress = venueAddress;
    if (centerLatitude !== undefined) zone.centerLatitude = centerLatitude;
    if (centerLongitude !== undefined) zone.centerLongitude = centerLongitude;
    if (radiusMeters !== undefined) zone.radiusMeters = radiusMeters;
    if (isVirtual !== undefined) zone.isVirtual = isVirtual;
    if (boundaryType !== undefined) zone.boundaryType = boundaryType;

    await zone.save();

    res.status(200).json({
      success: true,
      message: 'Zone location and coverage parameters updated successfully',
      data: zone,
    });
  } catch (err) {
    next(err);
  }
}

