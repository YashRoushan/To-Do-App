import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../schemas/task.schema';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(taskQuerySchema), taskController.getTasks);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/:id', taskController.getTask);
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Checklist routes
router.post('/:id/checklist', taskController.addChecklistItem);
router.patch('/:id/checklist/:itemId', taskController.updateChecklistItem);
router.delete('/:id/checklist/:itemId', taskController.deleteChecklistItem);

export default router;

