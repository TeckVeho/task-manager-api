import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { categoryService } from '../services/categoryService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, Category } from '../types';

export const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('color')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #FF0000)'),
  ],
  (req: AuthRequest, res: Response<ApiResponse<Category>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const category = categoryService.create(req.body.name, req.body.color);
    res.status(201).json({ data: category });
  },
);

categoryRouter.get('/', (_req: AuthRequest, res: Response<ApiResponse<Category[]>>) => {
  res.json({ data: categoryService.findAll() });
});

categoryRouter.put(
  '/:id',
  [
    body('name').optional().notEmpty(),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  (req: AuthRequest, res: Response<ApiResponse<Category>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const updated = categoryService.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ data: updated });
  },
);

categoryRouter.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<never>>) => {
  if (!categoryService.delete(req.params.id)) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json({ message: 'Category deleted' });
});
