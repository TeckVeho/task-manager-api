import request from 'supertest';
import app from '../index';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';

let token: string;

beforeEach(async () => {
  userService._reset();
  taskService._reset();
  await request(app)
    .post('/api/users/register')
    .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
  const res = await request(app)
    .post('/api/users/login')
    .send({ email: 'a@test.com', password: 'pass123' });
  token = res.body.data.token;
});

describe('POST /api/tasks', () => {
  it('creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fix bug', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Fix bug');
    expect(res.body.data.status).toBe('todo');
  });

  it('returns 400 without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'low' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task A', status: 'todo' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task B', status: 'done' });
  });

  it('returns all tasks', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=done')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Task B');
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/tasks/nonexistent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
