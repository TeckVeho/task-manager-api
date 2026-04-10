import { v4 as uuidv4 } from 'uuid';
import { Category } from '../types';

const db = new Map<string, Category>();

export const categoryService = {
  create(name: string, color: string): Category {
    const category: Category = {
      id: uuidv4(),
      name,
      color,
      createdAt: new Date(),
    };
    db.set(category.id, category);
    return category;
  },

  findAll(): Category[] {
    return [...db.values()];
  },

  findById(id: string): Category | undefined {
    return db.get(id);
  },

  update(id: string, data: Partial<Pick<Category, 'name' | 'color'>>): Category | undefined {
    const category = db.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...data };
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
