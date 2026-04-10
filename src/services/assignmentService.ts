import { taskService } from './taskService';
import { userService } from './userService';
import { categoryService } from './categoryService';
import { Task } from '../types';

export const assignmentService = {
  assignUser(taskId: string, userId: string): Task | undefined {
    if (!userService.findById(userId)) return undefined;
    return taskService.update(taskId, { assigneeId: userId });
  },

  assignCategory(taskId: string, categoryId: string): Task | undefined {
    if (!categoryService.findById(categoryId)) return undefined;
    return taskService.update(taskId, { categoryId });
  },

  getTasksAssignedTo(userId: string): Task[] {
    return taskService.findAll().filter((t) => t.assigneeId === userId);
  },
};
