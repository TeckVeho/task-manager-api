import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { taskService } from '../services/taskService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, Task } from '../types';

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
  ],
  (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const task = taskService.create(req.body);
    res.status(201).json({ data: task });
  },
);

taskRouter.get(
  '/',
  [query('status').optional().isIn(['todo', 'in_progress', 'done'])],
  (req: AuthRequest, res: Response<ApiResponse<Task[]>>) => {
    const status = req.query.status as Task['status'] | undefined;
    res.json({ data: taskService.findAll(status) });
  },
);

taskRouter.get('/:id', (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
  const task = taskService.findById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ data: task });
});

taskRouter.put(
  '/:id',
  [
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
  ],
  (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const updated = taskService.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ data: updated });
  },
);

taskRouter.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<never>>) => {
  if (!taskService.delete(req.params.id)) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ message: 'Task deleted' });
});
