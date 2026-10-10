import { Offer } from '../models/Offer.js';
import { Block } from '../models/Block.js';

/**
 * Multi-Factor Explainable Matching Engine
 *
 * Scoring Weights:
 * - Skill compatibility: 40%
 * - Availability overlap: 30%
 * - Category compatibility: 20%
 * - Workload / Capacity: 10%
 *
 * Returns scored match candidates with explicit, auditable reasons.
 */
export async function findMatchesForNeed(need) {
  if (!need || need.status !== 'OPEN') {
    return [];
  }

  const now = new Date();

  // 1. Fetch blocked users to exclude
  const blocks = await Block.find({
    $or: [
      { blockerId: need.requesterId },
      { blockedUserId: need.requesterId },
    ],
  }).lean();

  const excludedUserIds = new Set(
    blocks.map((b) =>
      b.blockerId.toString() === need.requesterId.toString()
        ? b.blockedUserId.toString()
        : b.blockerId.toString()
    )
  );

  // Exclude the requester themselves
  excludedUserIds.add(need.requesterId.toString());

  // 2. Fetch candidate offers within the same zone/event
  const candidateOffers = await Offer.find({
    zoneId: need.zoneId,
    status: 'ACTIVE',
    expiresAt: { $gt: now },
    helperId: { $nin: Array.from(excludedUserIds) },
  })
    .populate('helperId', 'name email bio skills role')
    .lean();

  const scoredMatches = [];

  for (const offer of candidateOffers) {
    if (!offer.helperId) continue;

    const reasons = [];
    let skillScore = 0;
    let availScore = 0;
    let catScore = 0;
    let workloadScore = 0;

    // --- Factor 1: Skills Compatibility (Weight: 40%) ---
    const needSkills = (need.requiredSkills || []).map((s) => s.toLowerCase().trim());
    const helperSkills = (offer.skills || []).map((s) => s.toLowerCase().trim());

    const matchedSkills = [];
    const missingSkills = [];

    if (needSkills.length === 0) {
      // General assistance need with no specific skill requirement
      skillScore = 80;
      reasons.push('General need: Helper has verified availability in the zone');
    } else {
      for (const reqSkill of needSkills) {
        if (helperSkills.some((hs) => hs.includes(reqSkill) || reqSkill.includes(hs))) {
          matchedSkills.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
        }
      }

      const matchRatio = matchedSkills.length / needSkills.length;
      skillScore = Math.round(matchRatio * 100);

      if (matchedSkills.length > 0) {
        reasons.push(
          `Matches ${matchedSkills.length} of ${needSkills.length} required skill(s): [${matchedSkills.join(', ')}]`
        );
      }
      if (missingSkills.length > 0) {
        reasons.push(`Missing skill(s): [${missingSkills.join(', ')}]`);
      }
    }

    // --- Factor 2: Availability Overlap (Weight: 30%) ---
    const requiredDuration = need.estimatedDurationMinutes || 60;
    const availableDuration = offer.availabilityMinutes || 60;

    let availabilityConflict = false;
    if (availableDuration >= requiredDuration) {
      availScore = 100;
      reasons.push(
        `Full availability: Helper offers ${availableDuration}m (task requires ${requiredDuration}m)`
      );
    } else {
      availScore = Math.round((availableDuration / requiredDuration) * 100);
      availabilityConflict = true;
      reasons.push(
        `Partial availability: Helper offers ${availableDuration}m (${requiredDuration - availableDuration}m short)`
      );
    }

    // --- Factor 3: Category Compatibility (Weight: 20%) ---
    const preferredCats = (offer.preferredCategories || []).map((c) => c.toLowerCase());
    if (preferredCats.length === 0 || preferredCats.includes(need.category.toLowerCase())) {
      catScore = 100;
      reasons.push(`Category alignment: ${need.category}`);
    } else {
      catScore = 50;
      reasons.push(`Cross-domain helper (preferred: ${offer.preferredCategories.join(', ')})`);
    }

    // --- Factor 4: Workload Capacity (Weight: 10%) ---
    const activeTasks = offer.activeTaskCount || 0;
    const maxTasks = offer.maxConcurrentTasks || 1;

    if (activeTasks === 0) {
      workloadScore = 100;
      reasons.push('Helper has zero active commitments');
    } else if (activeTasks < maxTasks) {
      workloadScore = 60;
      reasons.push(`Helper currently active on ${activeTasks}/${maxTasks} task(s)`);
    } else {
      workloadScore = 0;
      reasons.push('Helper is at maximum task capacity');
    }

    // Compute composite weighted score
    const totalScore = Math.round(
      skillScore * 0.4 +
      availScore * 0.3 +
      catScore * 0.2 +
      workloadScore * 0.1
    );

    // Filter out low scores (< 30) or over-capacity helpers
    if (totalScore >= 30 && activeTasks < maxTasks) {
      scoredMatches.push({
        offerId: offer._id,
        helper: {
          _id: offer.helperId._id,
          name: offer.helperId.name,
          bio: offer.helperId.bio,
          role: offer.helperId.role,
        },
        score: totalScore,
        scoreBreakdown: {
          skills: skillScore,
          availability: availScore,
          category: catScore,
          workload: workloadScore,
        },
        matchedSkills,
        missingSkills,
        availabilityConflict,
        availableMinutes: availableDuration,
        reasons,
        eligibilityStatus: 'eligible',
      });
    }
  }

  // Sort candidates by total score descending
  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches;
}
