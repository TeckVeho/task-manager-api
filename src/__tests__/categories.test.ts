import request from 'supertest';
import app from '../index';
import { userService } from '../services/userService';
import { categoryService } from '../services/categoryService';

let token: string;

beforeEach(async () => {
  userService._reset();
  categoryService._reset();
  await request(app)
    .post('/api/users/register')
    .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
  const res = await request(app)
    .post('/api/users/login')
    .send({ email: 'a@test.com', password: 'pass123' });
  token = res.body.data.token;
});

describe('POST /api/categories', () => {
  it('creates a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Frontend', color: '#3B82F6' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Frontend');
  });

  it('returns 400 for invalid color', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Frontend', color: 'blue' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Frontend', color: '#3B82F6' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/categories', () => {
  it('returns all categories', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Frontend', color: '#3B82F6' });
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('DELETE /api/categories/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .delete('/api/categories/nonexistent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
