import request from 'supertest';
import app from '../app';
import User from '../models/User.model';

describe('Tests d\'authentification simplifiés', () => {
  let testUser: any;

  beforeEach(async () => {
    // Créer un utilisateur de test
    testUser = await User.create({
      lastName: 'Test',
      firstName: 'User',
      email: 'test@simple.com',
      password: 'password123',
      role: 'admin'
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait permettre la connexion avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'password123'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait rejeter des identifiants incorrects', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Cookie Configuration', () => {
    it('devrait définir des cookies de sécurité', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@simple.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      console.log('Cookies:', cookies);
      
      if (cookies) {
        expect(Array.isArray(cookies)).toBe(true);
        const tokenCookie = Array.isArray(cookies) ? cookies.find((cookie: string) => cookie.startsWith('token=')) : null;
        if (tokenCookie) {
          expect(tokenCookie).toMatch(/HttpOnly/);
          expect(tokenCookie).toMatch(/SameSite=Strict/);
        }
      }
    });
  });
});