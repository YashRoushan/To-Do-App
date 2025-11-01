import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { AuthRequest } from '../middleware/auth.middleware';

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'rt';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefresh';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
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
    const user = await User.create({
      email,
      passwordHash,
      name,
    });

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
  } catch (error) {
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

