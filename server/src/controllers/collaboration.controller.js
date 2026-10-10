import { Collaboration } from '../models/Collaboration.js';
import { Need } from '../models/Need.js';
import { Offer } from '../models/Offer.js';

export async function getCollaboration(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id.toString();

    const collab = await Collaboration.findById(id)
      .populate('requesterId', 'name role bio')
      .populate('helperId', 'name role bio skills')
      .populate('needId')
      .populate('zoneId', 'name type radiusMeters');

    if (!collab) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration room not found',
      });
    }

    // Strict Server-Side Access Control:
    // Only accepted requester, accepted helper, or event organizer can view
    const isRequester = collab.requesterId._id.toString() === currentUserId;
    const isHelper = collab.helperId._id.toString() === currentUserId;
    const isOrganizer = req.user.role === 'organizer';

    if (!isRequester && !isHelper && !isOrganizer) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You do not have permission to view this collaboration room',
      });
    }

    res.status(200).json({
      success: true,
      data: collab,
    });
  } catch (err) {
    next(err);
  }
}

export async function addNote(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const currentUserId = req.user._id.toString();

    const collab = await Collaboration.findById(id);
    if (!collab) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration room not found',
      });
    }

    // Access control
    const isRequester = collab.requesterId.toString() === currentUserId;
    const isHelper = collab.helperId.toString() === currentUserId;

    if (!isRequester && !isHelper) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only active room participants can post notes',
      });
    }

    if (collab.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Cannot post notes to a ${collab.status.toLowerCase()} room`,
      });
    }

    collab.notes.push({
      senderId: req.user._id,
      senderName: req.user.name,
      text,
      createdAt: new Date(),
    });

    await collab.save();

    res.status(201).json({
      success: true,
      data: collab.notes[collab.notes.length - 1],
    });
  } catch (err) {
    next(err);
  }
}

export async function resolveCollaboration(req, res, next) {
  try {
    const { id } = req.params;
    const { summaryOutcome = '' } = req.body;
    const currentUserId = req.user._id.toString();

    const collab = await Collaboration.findById(id);
    if (!collab) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration room not found',
      });
    }

    const isRequester = collab.requesterId.toString() === currentUserId;
    const isHelper = collab.helperId.toString() === currentUserId;
    const isOrganizer = req.user.role === 'organizer';

    if (!isRequester && !isHelper && !isOrganizer) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only room participants can confirm resolution',
      });
    }

    const now = new Date();

    // Transition Collaboration status
    collab.status = 'RESOLVED';
    collab.completedAt = now;
    collab.completionConfirmedBy = req.user._id;
    if (summaryOutcome) collab.summaryOutcome = summaryOutcome;
    await collab.save();

    // Transition Need status
    await Need.findByIdAndUpdate(collab.needId, {
      status: 'RESOLVED',
      resolvedAt: now,
      resolutionNotes: summaryOutcome,
    });

    // Decrement helper task count
    if (collab.offerId) {
      await Offer.findByIdAndUpdate(collab.offerId, {
        $inc: { activeTaskCount: -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task successfully marked as RESOLVED! Collaboration archived.',
      data: collab,
    });
  } catch (err) {
    next(err);
  }
}

export async function leaveCollaboration(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id.toString();

    const collab = await Collaboration.findById(id);
    if (!collab) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration room not found',
      });
    }

    const isRequester = collab.requesterId.toString() === currentUserId;
    const isHelper = collab.helperId.toString() === currentUserId;

    if (!isRequester && !isHelper) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    collab.status = 'CANCELLED';
    await collab.save();

    // Reset Need back to OPEN so another helper can pick it up
    await Need.findByIdAndUpdate(collab.needId, {
      status: 'OPEN',
      acceptedHelperId: null,
      activeCollaborationId: null,
    });

    if (collab.offerId) {
      await Offer.findByIdAndUpdate(collab.offerId, {
        $inc: { activeTaskCount: -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Collaboration ended and task returned to OPEN pool',
      data: collab,
    });
  } catch (err) {
    next(err);
  }
}
