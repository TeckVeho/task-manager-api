import request from 'supertest';
import app from '../index';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';

let token: string;
let userId: string;
let taskId: string;
let categoryId: string;

beforeEach(async () => {
  userService._reset();
  taskService._reset();
  categoryService._reset();

  const reg = await request(app)
    .post('/api/users/register')
    .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
  userId = reg.body.data.id;

  const login = await request(app)
    .post('/api/users/login')
    .send({ email: 'a@test.com', password: 'pass123' });
  token = login.body.data.token;

  const task = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Task', priority: 'high' });
  taskId = task.body.data.id;

  const cat = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Frontend', color: '#3B82F6' });
  categoryId = cat.body.data.id;
});

describe('POST /api/tasks/:taskId/assign-user', () => {
  it('assigns a user to a task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/assign-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });
    expect(res.status).toBe(200);
    expect(res.body.data.assigneeId).toBe(userId);
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/assign-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  it('returns 400 without userId', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/assign-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/tasks/:taskId/assign-category', () => {
  it('assigns a category to a task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/assign-category`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId });
    expect(res.status).toBe(200);
    expect(res.body.data.categoryId).toBe(categoryId);
  });

  it('returns 404 for non-existent category', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/assign-category`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: 'nonexistent' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/:userId/tasks', () => {
  it('returns tasks assigned to user', async () => {
    await request(app)
      .post(`/api/tasks/${taskId}/assign-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });
    const res = await request(app)
      .get(`/api/users/${userId}/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(taskId);
  });

  it('returns empty array when no tasks assigned', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(0);
  });
});
