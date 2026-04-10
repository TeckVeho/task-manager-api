import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';

const db = new Map<string, Task>();

export const taskService = {
  create(data: Pick<Task, 'title' | 'description' | 'priority' | 'status'>): Task {
    const task: Task = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      priority: data.priority ?? 'medium',
      status: data.status ?? 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.set(task.id, task);
    return task;
  },

  findAll(status?: Task['status']): Task[] {
    const all = [...db.values()];
    return status ? all.filter((t) => t.status === status) : all;
  },

  findById(id: string): Task | undefined {
    return db.get(id);
  },

  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | undefined {
    const task = db.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...data, updatedAt: new Date() };
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
