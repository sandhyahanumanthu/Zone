import { Report } from '../models/Report.js';
import { Block } from '../models/Block.js';
import { Need } from '../models/Need.js';
import { User } from '../models/User.js';

export async function createReport(req, res, next) {
  try {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user._id;

    const report = await Report.create({
      reporterId,
      targetType,
      targetId,
      reason,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Safety report submitted. Our moderation system will review.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

export async function getModerationQueue(req, res, next) {
  try {
    if (req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Moderator access required',
      });
    }

    const { status = 'pending' } = req.query;

    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .populate('reporterId', 'name email role')
      .lean();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
}

export async function moderateReport(req, res, next) {
  try {
    if (req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Moderator access required',
      });
    }

    const { id } = req.params;
    const { status, actionTaken = 'none', moderatorNotes = '' } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    report.status = status;
    await report.save();

    // Take concrete action if specified
    if (actionTaken === 'removed_content') {
      if (report.targetType === 'need') {
        await Need.findByIdAndUpdate(report.targetId, { status: 'CANCELLED' });
      }
    } else if (actionTaken === 'deactivated_user') {
      if (report.targetType === 'user') {
        await User.findByIdAndUpdate(report.targetId, { isActive: false });
      }
    }

    res.status(200).json({
      success: true,
      message: `Moderation verdict recorded: ${status} (Action: ${actionTaken})`,
      data: {
        report,
        moderatorNotes,
        actionTaken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function blockUser(req, res, next) {
  try {
    const { targetUserId } = req.body;
    const blockerId = req.user._id;

    if (blockerId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block yourself',
      });
    }

    const block = await Block.findOneAndUpdate(
      { blockerId, blockedUserId: targetUserId },
      { blockerId, blockedUserId: targetUserId },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'User blocked. They will not appear in your match suggestions.',
      data: block,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBlockedUsers(req, res, next) {
  try {
    const blockerId = req.user._id;

    const blocks = await Block.find({ blockerId })
      .populate('blockedUserId', 'name bio')
      .lean();

    res.status(200).json({
      success: true,
      data: blocks.map((b) => b.blockedUserId),
    });
  } catch (err) {
    next(err);
  }
}
