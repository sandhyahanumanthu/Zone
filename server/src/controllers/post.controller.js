import mongoose from 'mongoose';
import { Post } from '../models/Post.js';

export async function getPosts(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database is disconnected. Cannot retrieve posts.',
      });
    }

    const { page = 1, limit = 10, category, zoneId } = req.query;

    const query = {
      moderationStatus: 'approved',
      expiresAt: { $gt: new Date() }, // Exclude expired posts
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (zoneId) {
      query.zoneId = zoneId;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name role bio')
        .populate('zoneId', 'name type radiusMeters')
        .lean(),
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      data: posts,
    });
  } catch (err) {
    next(err);
  }
}
