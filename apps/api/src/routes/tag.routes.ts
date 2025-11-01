import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTagSchema, updateTagSchema } from '../schemas/tag.schema';

const router = Router();

router.use(authenticate);

router.get('/', tagController.getTags);
router.post('/', validate(createTagSchema), tagController.createTag);
router.patch('/:id', validate(updateTagSchema), tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

export default router;

