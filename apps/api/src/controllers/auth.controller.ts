import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Tag } from '../models/Tag';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { AuthRequest } from '../middleware/auth.middleware';

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'rt';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefresh';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  let user: any = null;
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      passwordHash,
      name,
    });

    // Create default tags for new user
    // Use try-catch to handle any errors gracefully (e.g., if tags already exist)
    try {
      const defaultTags = [
        { name: 'work', color: '#3B82F6' },
        { name: 'health', color: '#10B981' },
        { name: 'side hustle', color: '#F59E0B' },
        { name: 'school', color: '#8B5CF6' },
        { name: 'personal', color: '#EC4899' },
        { name: 'fitness', color: '#EF4444' },
        { name: 'project', color: '#06B6D4' },
      ];

      await Tag.insertMany(
        defaultTags.map((tag) => ({
          userId: user._id,
          name: tag.name,
          color: tag.color,
        })),
        { ordered: false } // Continue inserting even if some fail (e.g., duplicates)
      );
    } catch (tagError: any) {
      // Log error but don't fail signup if tags already exist or other non-critical errors
      console.warn('Failed to create default tags for user:', tagError.message);
      // Continue with signup even if tag creation fails
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        settings: user.settings,
      },
      accessToken,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // If user was created but something else failed, clean up
    if (user && user._id) {
      try {
        await User.findByIdAndDelete(user._id);
        // Also clean up any tags that might have been created
        await Tag.deleteMany({ userId: user._id });
      } catch (cleanupError) {
        console.error('Failed to cleanup user after signup error:', cleanupError);
      }
    }
    
    // Provide more specific error messages
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Validation failed',
        },
      });
    }
    
    if (error?.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Email already registered',
        },
      });
    }
    
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        settings: user.settings,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token required',
        },
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'User not found',
        },
      });
    }

    const accessToken = generateAccessToken(user._id.toString());

    res.json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME);
  res.json({ message: 'Logged out successfully' });
};

