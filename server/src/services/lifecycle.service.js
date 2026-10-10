import { Need } from '../models/Need.js';
import { Offer } from '../models/Offer.js';
import { Collaboration } from '../models/Collaboration.js';

/**
 * Request Lifecycle & Expiry Enforcement Service
 *
 * Implements strict state machine validation and sweeps expired entities.
 */
export async function sweepExpiredEntities() {
  const now = new Date();

  // 1. Expire OPEN needs whose deadline has passed
  const expiredNeedsResult = await Need.updateMany(
    {
      status: { $in: ['OPEN', 'MATCHED'] },
      expiresAt: { $lt: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );

  // 2. Expire ACTIVE offers whose availability window has passed
  const expiredOffersResult = await Offer.updateMany(
    {
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );

  // 3. Auto-expire ACTIVE collaborations whose deadline has lapsed
  const expiredCollabsResult = await Collaboration.updateMany(
    {
      status: 'ACTIVE',
      deadline: { $lt: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );

  return {
    expiredNeeds: expiredNeedsResult.modifiedCount || 0,
    expiredOffers: expiredOffersResult.modifiedCount || 0,
    expiredCollaborations: expiredCollabsResult.modifiedCount || 0,
    sweepTimestamp: now,
  };
}

/**
 * Validates whether a state transition is legal according to the DropZone state machine:
 * OPEN -> MATCHED -> IN_PROGRESS -> RESOLVED / CANCELLED / EXPIRED
 */
export function validateStateTransition(currentStatus, targetStatus) {
  const allowedTransitions = {
    OPEN: ['MATCHED', 'IN_PROGRESS', 'CANCELLED', 'EXPIRED'],
    MATCHED: ['IN_PROGRESS', 'OPEN', 'CANCELLED', 'EXPIRED'],
    IN_PROGRESS: ['RESOLVED', 'CANCELLED', 'EXPIRED'],
    RESOLVED: [], // Terminal
    CANCELLED: [], // Terminal
    EXPIRED: [], // Terminal
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(targetStatus);
}
