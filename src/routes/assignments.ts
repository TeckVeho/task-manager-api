import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { assignmentService } from '../services/assignmentService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, Task } from '../types';

export const assignmentRouter = Router();

assignmentRouter.use(authenticate);

assignmentRouter.post(
  '/tasks/:taskId/assign-user',
  [body('userId').notEmpty().withMessage('userId is required')],
  (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const task = assignmentService.assignUser(req.params.taskId, req.body.userId);
    if (!task) {
      res.status(404).json({ error: 'Task or user not found' });
      return;
    }
    res.json({ data: task });
  },
);

assignmentRouter.post(
  '/tasks/:taskId/assign-category',
  [body('categoryId').notEmpty().withMessage('categoryId is required')],
  (req: AuthRequest, res: Response<ApiResponse<Task>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const task = assignmentService.assignCategory(req.params.taskId, req.body.categoryId);
    if (!task) {
      res.status(404).json({ error: 'Task or category not found' });
      return;
    }
    res.json({ data: task });
  },
);

assignmentRouter.get(
  '/users/:userId/tasks',
  (req: AuthRequest, res: Response<ApiResponse<Task[]>>) => {
    res.json({ data: assignmentService.getTasksAssignedTo(req.params.userId) });
  },
);
