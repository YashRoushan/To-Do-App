import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/auth.routes';
import { errorHandler } from '../middleware/error.middleware';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth API', () => {
  beforeAll(async () => {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app-test';
    await mongoose.connect(mongo);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email');
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `test${Date.now()}@example.com`;
      await request(app).post('/api/v1/auth/signup').send({
        email,
        password: 'password123',
        name: 'Test User',
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email,
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });
  });
});

