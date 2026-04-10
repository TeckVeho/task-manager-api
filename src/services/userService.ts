import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { JWT_SECRET } from '../middleware/auth';

const db = new Map<string, User>();

export const userService = {
  async register(email: string, name: string, password: string): Promise<User> {
    if ([...db.values()].some((u) => u.email === email)) {
      throw new Error('Email already in use');
    }
    const user: User = {
      id: uuidv4(),
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date(),
    };
    db.set(user.id, user);
    return user;
  },

  async login(email: string, password: string): Promise<string> {
    const user = [...db.values()].find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
  },

  findById(id: string): User | undefined {
    return db.get(id);
  },

  findAll(): User[] {
    return [...db.values()];
  },

  update(id: string, data: Partial<Pick<User, 'name' | 'email'>>): User | undefined {
    const user = db.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    db.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return db.delete(id);
  },

  _reset(): void {
    db.clear();
  },
};
