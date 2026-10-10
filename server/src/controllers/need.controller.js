import mongoose from 'mongoose';
import { Need } from '../models/Need.js';
import { Zone } from '../models/Zone.js';
import { Offer } from '../models/Offer.js';
import { Collaboration } from '../models/Collaboration.js';
import { EventMembership } from '../models/EventMembership.js';
import { extractNeedDraftFromText } from '../services/aiExtraction.service.js';
import { sweepExpiredEntities } from '../services/lifecycle.service.js';

export async function createNeed(req, res, next) {
  try {
    const {
      zoneId,
      title,
      description,
      category,
      requiredSkills = [],
      estimatedDurationMinutes = 60,
      urgency = 'normal',
      expiryHours = 6,
      visibility = 'members_only',
    } = req.body;

    const requesterId = req.user._id;

    // Verify Zone exists and is active
    const zone = await Zone.findOne({ _id: zoneId, isActive: true });
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Active event zone not found',
      });
    }

    // Ensure user has joined the event context (ContextPass)
    let membership = await EventMembership.findOne({ userId: requesterId, zoneId });
    if (!membership) {
      membership = await EventMembership.create({
        userId: requesterId,
        zoneId,
        role: req.user.role === 'organizer' ? 'organizer' : 'participant',
        status: 'active',
      });
    }

    const expiresAt = new Date(Date.now() + expiryHours * 3600000);

    const need = await Need.create({
      requesterId,
      zoneId,
      title,
      description,
      category,
      requiredSkills,
      estimatedDurationMinutes,
      urgency,
      expiresAt,
      visibility,
      status: 'OPEN',
    });

    res.status(201).json({
      success: true,
      message: 'Need published successfully to the Need-to-Action network',
      data: need,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNeeds(req, res, next) {
  try {
    // Run lazy expiry sweep before fetching
    await sweepExpiredEntities();

    const { zoneId, category, status, myNeedsOnly, includeResolved } = req.query;

    const query = {};

    if (zoneId) {
      query.zoneId = zoneId;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (myNeedsOnly === 'true' && req.user) {
      query.requesterId = req.user._id;
    } else if (status) {
      if (status === 'all') {
        // Return all statuses without expiry restriction
      } else if (status === 'RESOLVED' || status === 'EXPIRED' || status === 'CANCELLED') {
        query.status = status;
      } else {
        query.status = status;
        query.expiresAt = { $gt: new Date() };
      }
    } else if (includeResolved === 'true') {
      query.status = { $in: ['OPEN', 'MATCHED', 'IN_PROGRESS', 'RESOLVED'] };
    } else {
      // By default, show active requests (OPEN, MATCHED, IN_PROGRESS)
      query.status = { $in: ['OPEN', 'MATCHED', 'IN_PROGRESS'] };
      query.expiresAt = { $gt: new Date() };
    }

    const needs = await Need.find(query)
      .sort({ createdAt: -1 })
      .populate('requesterId', 'name role bio')
      .populate('acceptedHelperId', 'name role bio')
      .populate('zoneId', 'name type radiusMeters venueName venueAddress boundaryType isVirtual')
      .lean();

    res.status(200).json({
      success: true,
      count: needs.length,
      data: needs,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNeedById(req, res, next) {
  try {
    const { id } = req.params;

    const need = await Need.findById(id)
      .populate('requesterId', 'name role bio skills')
      .populate('acceptedHelperId', 'name role bio skills')
      .populate('zoneId', 'name type radiusMeters joinCode')
      .populate('activeCollaborationId')
      .lean();

    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Need request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: need,
    });
  } catch (err) {
    next(err);
  }
}

export async function extractDraft(req, res, next) {
  try {
    const { text } = req.body;
    const extractedDraft = await extractNeedDraftFromText(text);

    res.status(200).json({
      success: true,
      data: extractedDraft,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelNeed(req, res, next) {
  try {
    const { id } = req.params;
    const need = await Need.findById(id);

    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Need not found',
      });
    }

    // Ownership or organizer check
    const isOwner = need.requesterId.toString() === req.user._id.toString();
    const isOrganizer = req.user.role === 'organizer';

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only cancel requests you created',
      });
    }

    if (need.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a need that has already been resolved',
      });
    }

    need.status = 'CANCELLED';
    await need.save();

    res.status(200).json({
      success: true,
      message: 'Need request cancelled',
      data: need,
    });
  } catch (err) {
    next(err);
  }
}

export async function resolveNeed(req, res, next) {
  try {
    const { id } = req.params;
    const { resolutionNotes = '' } = req.body;
    const need = await Need.findById(id);

    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Need not found',
      });
    }

    const isOwner = need.requesterId.toString() === req.user._id.toString();
    const isOrganizer = req.user.role === 'organizer';

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only the creator or an organizer can resolve this request',
      });
    }

    if (need.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        error: need.category === 'Lost & Found'
          ? 'Item Found — This request has already been resolved.'
          : 'Request Resolved — This request is already resolved.',
      });
    }

    const now = new Date();
    need.status = 'RESOLVED';
    need.resolvedAt = now;
    need.resolutionNotes = resolutionNotes || (need.category === 'Lost & Found' ? 'Item found and returned' : 'Resolved by requester');
    await need.save();

    // If there was an active collaboration room, mark it resolved as well and decrement helper workload
    if (need.activeCollaborationId) {
      const collab = await Collaboration.findById(need.activeCollaborationId);
      if (collab && collab.status === 'ACTIVE') {
        collab.status = 'RESOLVED';
        collab.completedAt = now;
        collab.completionConfirmedBy = req.user._id;
        collab.summaryOutcome = need.resolutionNotes;
        await collab.save();

        if (collab.offerId) {
          await Offer.findByIdAndUpdate(collab.offerId, { $inc: { activeTaskCount: -1 } });
        }
      }
    }

    const resolvedMessage = need.category === 'Lost & Found'
      ? 'Item Found — This request has been resolved. No further claims are being accepted.'
      : 'Request Resolved — No further responses are needed.';

    res.status(200).json({
      success: true,
      message: resolvedMessage,
      data: need,
    });
  } catch (err) {
    next(err);
  }
}

