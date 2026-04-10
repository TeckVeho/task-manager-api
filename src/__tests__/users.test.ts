import request from 'supertest';
import app from '../index';
import { userService } from '../services/userService';

beforeEach(() => {
  userService._reset();
});

describe('POST /api/users/register', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('a@test.com');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'bad', name: 'Alice', password: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    await request(app)
      .post('/api/users/register')
      .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'a@test.com', name: 'Bob', password: 'pass123' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/users/register')
      .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
  });

  it('returns token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'a@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'a@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns user list with valid token', async () => {
    await request(app)
      .post('/api/users/register')
      .send({ email: 'a@test.com', name: 'Alice', password: 'pass123' });
    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'a@test.com', password: 'pass123' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
