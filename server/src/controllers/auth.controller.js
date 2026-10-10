import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

/**
 * Register a new user with hashed password and establish session.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, bio } = req.body;

    // Check for duplicate email
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    // Hash password using bcryptjs (cost factor 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user record
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      bio: bio || '',
      role: 'user',
    });

    // Generate JWT token
    const token = signToken({ id: user._id, role: user.role });

    // Set secure HttpOnly cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate existing user with email and password.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly query passwordHash which is hidden by default
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact support.',
      });
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.',
      });
    }

    // Generate JWT
    const token = signToken({ id: user._id, role: user.role });

    // Set secure HttpOnly cookie
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Terminate session and clear authentication cookie.
 */
export async function logout(req, res) {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * Retrieve currently authenticated user profile.
 */
export async function getCurrentUser(req, res) {
  res.status(200).json({
    success: true,
    user: req.user,
  });
}

/**
 * Update current user profile fields (name, bio).
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, bio } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
