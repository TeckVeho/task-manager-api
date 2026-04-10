import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { userService } from '../services/userService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, User } from '../types';

export const userRouter = Router();

type SafeUser = Omit<User, 'passwordHash'>;
const safe = (u: User): SafeUser => {
  const { passwordHash: _, ...rest } = u;
  return rest;
};

userRouter.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: AuthRequest, res: Response<ApiResponse<SafeUser>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    try {
      const user = await userService.register(req.body.email, req.body.name, req.body.password);
      res.status(201).json({ data: safe(user) });
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  },
);

userRouter.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: AuthRequest, res: Response<ApiResponse<{ token: string }>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    try {
      const token = await userService.login(req.body.email, req.body.password);
      res.json({ data: { token } });
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  },
);

userRouter.get('/', authenticate, (_req: AuthRequest, res: Response<ApiResponse<SafeUser[]>>) => {
  res.json({ data: userService.findAll().map(safe) });
});

userRouter.put(
  '/:id',
  authenticate,
  [body('name').optional().notEmpty(), body('email').optional().isEmail()],
  (req: AuthRequest, res: Response<ApiResponse<SafeUser>>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg as string });
      return;
    }
    const updated = userService.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ data: safe(updated) });
  },
);

userRouter.delete('/:id', authenticate, (req: AuthRequest, res: Response<ApiResponse<never>>) => {
  if (!userService.delete(req.params.id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ message: 'User deleted' });
});
