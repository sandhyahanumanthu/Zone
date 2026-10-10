import mongoose from 'mongoose';
import { Offer } from '../models/Offer.js';
import { Zone } from '../models/Zone.js';
import { EventMembership } from '../models/EventMembership.js';
import { User } from '../models/User.js';
import { sweepExpiredEntities } from '../services/lifecycle.service.js';

export async function createOrUpdateOffer(req, res, next) {
  try {
    const {
      zoneId,
      skills,
      availabilityMinutes = 120,
      preferredCategories = [],
      maxConcurrentTasks = 1,
      expiryHours = 8,
    } = req.body;

    const helperId = req.user._id;

    // Verify Zone exists and is active
    const zone = await Zone.findOne({ _id: zoneId, isActive: true });
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Active event zone not found',
      });
    }

    // Ensure helper is a registered event member
    let membership = await EventMembership.findOne({ userId: helperId, zoneId });
    if (!membership) {
      membership = await EventMembership.create({
        userId: helperId,
        zoneId,
        role: 'participant',
        status: 'active',
      });
    }

    // Also update User profile skills if provided
    if (skills && skills.length > 0) {
      await User.findByIdAndUpdate(helperId, {
        $addToSet: { skills: { $each: skills } },
      });
    }

    const expiresAt = new Date(Date.now() + expiryHours * 3600000);

    // Upsert active offer for this helper in this zone
    const offer = await Offer.findOneAndUpdate(
      { helperId, zoneId },
      {
        skills,
        availabilityMinutes,
        preferredCategories,
        maxConcurrentTasks,
        status: 'ACTIVE',
        expiresAt,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Helper offer active and searchable by matching engine',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOffers(req, res, next) {
  try {
    // Run lazy expiry sweep before fetching
    await sweepExpiredEntities();

    const { zoneId, includeAll } = req.query;
    const query = {
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    };

    // By default, only show offers that have available capacity (not at max tasks)
    if (includeAll !== 'true') {
      query.$expr = { $lt: ['$activeTaskCount', '$maxConcurrentTasks'] };
    }

    if (zoneId) query.zoneId = zoneId;

    const offers = await Offer.find(query)
      .populate('helperId', 'name role bio skills')
      .populate('zoneId', 'name type radiusMeters venueName venueAddress')
      .lean();

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyOffer(req, res, next) {
  try {
    const { zoneId } = req.query;
    const helperId = req.user._id;

    const query = { helperId };
    if (zoneId) query.zoneId = zoneId;

    const offer = await Offer.findOne(query).sort({ updatedAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleOfferStatus(req, res, next) {
  try {
    const { id } = req.params;
    const helperId = req.user._id;

    const offer = await Offer.findOne({ _id: id, helperId });
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found or unauthorized',
      });
    }

    offer.status = offer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer status changed to ${offer.status}`,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}
