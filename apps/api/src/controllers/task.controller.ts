import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth.middleware';
import { parseISO } from 'date-fns';

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      from,
      to,
      q,
      tags,
      priority,
      limit = '50',
      cursor,
    } = req.query;

    const query: any = { userId: req.userId };

    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.$or = [];
      if (from) {
        query.$or.push({ dueAt: { $gte: parseISO(from as string) } });
        query.$or.push({ startAt: { $gte: parseISO(from as string) } });
      }
      if (to) {
        if (!query.$or) query.$or = [];
        query.$or.push({ dueAt: { $lte: parseISO(to as string) } });
        query.$or.push({ startAt: { $lte: parseISO(to as string) } });
      }
    }

    if (q) {
      query.$or = query.$or || [];
      query.$or.push({ title: { $regex: q, $options: 'i' } });
      query.$or.push({ description: { $regex: q, $options: 'i' } });
    }

    if (tags) {
      const tagIds = (tags as string).split(',').map((id) => new mongoose.Types.ObjectId(id));
      query.tags = { $in: tagIds };
    }

    if (priority) {
      query.priority = { $gte: Number(priority) };
    }

    if (cursor) {
      query._id = { $gt: new mongoose.Types.ObjectId(cursor as string) };
    }

    const tasks = await Task.find(query)
      .populate('tags')
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      tasks,
      nextCursor: tasks.length === Number(limit) ? tasks[tasks.length - 1]._id : null,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.userId!,
      tags: req.body.tags?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
      checklist: req.body.checklist?.map((item: any) => ({
        _id: new mongoose.Types.ObjectId(),
        label: item.label,
        done: item.done || false,
      })) || [],
    };

    if (taskData.dueAt) taskData.dueAt = new Date(taskData.dueAt);
    if (taskData.startAt) taskData.startAt = new Date(taskData.startAt);

    const task = await Task.create(taskData);

    await Activity.create({
      userId: req.userId!,
      taskId: task._id,
      type: 'created',
      at: new Date(),
    });

    await task.populate('tags');
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('tags');

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    const oldStatus = task.status;
    Object.assign(task, req.body);

    if (req.body.tags) {
      task.tags = req.body.tags.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    if (req.body.dueAt) task.dueAt = new Date(req.body.dueAt);
    if (req.body.startAt) task.startAt = new Date(req.body.startAt);

    await task.save();
    await task.populate('tags');

    // Log activity
    if (req.body.status && req.body.status !== oldStatus) {
      const activityType =
        req.body.status === 'done' ? 'completed' : req.body.status === 'in_progress' ? 'started' : 'edited';
      await Activity.create({
        userId: req.userId!,
        taskId: task._id,
        type: activityType,
        at: new Date(),
      });
    } else if (Object.keys(req.body).length > 0) {
      await Activity.create({
        userId: req.userId!,
        taskId: task._id,
        type: 'edited',
        at: new Date(),
      });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    // Delete related activities
    await Activity.deleteMany({ taskId: task._id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addChecklistItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    const { label } = req.body;
    task.checklist.push({
      _id: new mongoose.Types.ObjectId(),
      label,
      done: false,
    });

    await task.save();
    await task.populate('tags');
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateChecklistItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    const item = task.checklist.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Checklist item not found',
        },
      });
    }

    if (req.body.label !== undefined) item.label = req.body.label;
    if (req.body.done !== undefined) item.done = req.body.done;

    await task.save();
    await task.populate('tags');
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    task.checklist.id(req.params.itemId)?.deleteOne();
    await task.save();
    await task.populate('tags');
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

