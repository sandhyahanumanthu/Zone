import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function getUserProfile(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database is disconnected. Cannot retrieve user profile.',
      });
    }

    const { id } = req.params;
    // Explicitly exclude passwordHash and private fields
    const user = await User.findOne({ _id: id, isActive: true })
      .select('-passwordHash -__v')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}
