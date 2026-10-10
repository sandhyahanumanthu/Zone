import { Need } from '../models/Need.js';
import { Offer } from '../models/Offer.js';
import { Collaboration } from '../models/Collaboration.js';
import { findMatchesForNeed } from '../services/matching.service.js';

export async function getMatches(req, res, next) {
  try {
    const { needId } = req.params;

    const need = await Need.findById(needId);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Need request not found',
      });
    }

    // Explicit Lifecycle Status Checks
    if (need.status === 'RESOLVED') {
      const msg = need.category === 'Lost & Found'
        ? 'Item Found — This request has been resolved. No further claims or matches are being accepted.'
        : 'Request Resolved — No further responses are needed.';
      return res.status(400).json({
        success: false,
        error: msg,
        lifecycleStatus: 'RESOLVED',
      });
    }

    if (need.status === 'EXPIRED' || (need.expiresAt && need.expiresAt < new Date())) {
      return res.status(400).json({
        success: false,
        error: 'Expired — This request is no longer active.',
        lifecycleStatus: 'EXPIRED',
      });
    }

    if (need.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Cancelled by Owner.',
        lifecycleStatus: 'CANCELLED',
      });
    }

    if (need.status === 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: 'This request is already active in a collaborative session.',
        lifecycleStatus: 'IN_PROGRESS',
        activeCollaborationId: need.activeCollaborationId,
      });
    }

    const matches = await findMatchesForNeed(need);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptMatch(req, res, next) {
  try {
    const { needId } = req.params;
    const { offerId } = req.body;
    const currentUserId = req.user._id;

    // 1. Initial lookup
    const need = await Need.findById(needId);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: 'Need request not found',
      });
    }

    if (need.status === 'RESOLVED') {
      const resolvedMsg = need.category === 'Lost & Found'
        ? 'Item Found — This request has been resolved. No further claims are being accepted.'
        : 'Request Resolved — No further responses are needed.';
      return res.status(409).json({
        success: false,
        error: resolvedMsg,
      });
    }

    if (need.status === 'EXPIRED' || need.expiresAt < new Date()) {
      return res.status(409).json({
        success: false,
        error: 'Expired — This request is no longer active.',
      });
    }

    if (need.status === 'CANCELLED') {
      return res.status(409).json({
        success: false,
        error: 'Cancelled by Owner.',
      });
    }

    if (need.status !== 'OPEN' && need.status !== 'MATCHED') {
      return res.status(409).json({
        success: false,
        error: `Cannot accept match on a request with status ${need.status}`,
      });
    }

    const offer = await Offer.findById(offerId).populate('helperId');
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Helper offer not found',
      });
    }

    if (offer.status !== 'ACTIVE' || offer.expiresAt < new Date()) {
      return res.status(409).json({
        success: false,
        error: 'Already Claimed — This offer is no longer active or has expired.',
      });
    }

    // The user accepting must be either the requester or the helper
    const isRequester = need.requesterId.toString() === currentUserId.toString();
    const isHelper = offer.helperId._id.toString() === currentUserId.toString();

    if (!isRequester && !isHelper) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only the requester or matched helper can accept a collaboration',
      });
    }

    // 2. Concurrency Safety: Atomically reserve offer capacity first
    const claimedOffer = await Offer.findOneAndUpdate(
      {
        _id: offerId,
        status: 'ACTIVE',
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$activeTaskCount', '$maxConcurrentTasks'] },
      },
      { $inc: { activeTaskCount: 1 } },
      { new: true }
    );

    if (!claimedOffer) {
      return res.status(409).json({
        success: false,
        error: 'Already Claimed — This offer is no longer available or the helper has reached maximum task capacity.',
      });
    }

    // 3. Atomically transition Need from OPEN/MATCHED to IN_PROGRESS
    const claimedNeed = await Need.findOneAndUpdate(
      {
        _id: needId,
        status: { $in: ['OPEN', 'MATCHED'] },
      },
      {
        status: 'IN_PROGRESS',
        acceptedHelperId: offer.helperId._id,
      },
      { new: true }
    );

    if (!claimedNeed) {
      // Revert helper task count if need was already grabbed
      await Offer.findByIdAndUpdate(offerId, { $inc: { activeTaskCount: -1 } });
      return res.status(409).json({
        success: false,
        error: 'This request was just accepted, claimed, or resolved by another participant.',
      });
    }

    // Task duration deadline (duration minutes from now)
    const durationMinutes = need.estimatedDurationMinutes || 60;
    const deadline = new Date(Date.now() + durationMinutes * 60000);

    // Create Collaboration Room
    const collaboration = await Collaboration.create({
      needId: need._id,
      offerId: offer._id,
      requesterId: need.requesterId,
      helperId: offer.helperId._id,
      zoneId: need.zoneId,
      status: 'ACTIVE',
      deadline,
      notes: [
        {
          senderId: currentUserId,
          senderName: req.user.name,
          text: `🤝 Collaboration initialized! Task timer set for ${durationMinutes} minutes. Work together to resolve: "${need.title}"`,
          createdAt: new Date(),
        },
      ],
    });

    // Link activeCollaborationId on the Need record
    claimedNeed.activeCollaborationId = collaboration._id;
    await claimedNeed.save();

    res.status(201).json({
      success: true,
      message: 'Match accepted! Collaboration workspace opened.',
      data: {
        collaborationId: collaboration._id,
        need: claimedNeed,
        collaboration,
      },
    });
  } catch (err) {
    next(err);
  }
}
