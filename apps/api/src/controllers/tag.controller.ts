import { Response, NextFunction } from 'express';
import { Tag } from '../models/Tag';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tags = await Tag.find({ userId: req.userId }).sort({ name: 1 });
    res.json({ tags });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body;

    const existingTag = await Tag.findOne({ userId: req.userId, name });
    if (existingTag) {
      return res.status(400).json({
        error: {
          code: 'TAG_EXISTS',
          message: 'Tag with this name already exists',
        },
      });
    }

    const tag = await Tag.create({
      userId: req.userId!,
      name,
      color: color || '#3B82F6',
    });

    res.status(201).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const updateTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await Tag.findOne({ _id: id, userId: req.userId });
    if (!tag) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      });
    }

    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({ userId: req.userId, name });
      if (existingTag) {
        return res.status(400).json({
          error: {
            code: 'TAG_EXISTS',
            message: 'Tag with this name already exists',
          },
        });
      }
      tag.name = name;
    }

    if (color) {
      tag.color = color;
    }

    await tag.save();
    res.json({ tag });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findOneAndDelete({ _id: id, userId: req.userId });
    if (!tag) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      });
    }

    // Remove tag from all tasks
    const { Task } = require('../models/Task');
    await Task.updateMany(
      { userId: req.userId, tags: id },
      { $pull: { tags: id } }
    );

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
};

