import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Tests d\'authentification et autorisation', () => {
  let adminUser: any;
  let managerUser: any;
  let employeeUser: any;
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@test.com', 'manager@test.com', 'employee@test.com']
        }
      }
    });

    // Hasher le mot de passe manuellement (Prisma n'a pas de hook pre-save)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Créer des utilisateurs de test avec différents rôles
    adminUser = await prisma.user.create({
      data: {
        lastName: 'Admin',
        firstName: 'Test',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin'
      }
    });

    managerUser = await prisma.user.create({
      data: {
        lastName: 'Manager',
        firstName: 'Test',
        email: 'manager@test.com',
        password: hashedPassword,
        role: 'manager'
      }
    });

    employeeUser = await prisma.user.create({
      data: {
        lastName: 'Employee',
        firstName: 'Test',
        email: 'employee@test.com',
        password: hashedPassword,
        role: 'employee'
      }
    });

    // Générer des tokens JWT pour les tests
    adminToken = jwt.sign(
      { user: { id: adminUser.id, email: adminUser.email, role: adminUser.role } },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      { user: { id: managerUser.id, email: managerUser.email, role: managerUser.role } },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { user: { id: employeeUser.id, email: employeeUser.email, role: employeeUser.role } },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@test.com', 'manager@test.com', 'employee@test.com']
        }
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait permettre la connexion avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('admin@test.com');
      expect(response.body.user.role).toBe('admin');
      
      // Vérifier que le cookie httpOnly est défini
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=.*HttpOnly.*SameSite=Strict/);
    });

    it('devrait rejeter des identifiants invalides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          motDePasse: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalides/i);
    });

    it('devrait rejeter un email inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait valider les champs requis', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com'
          // password manquant
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('devrait permettre la déconnexion', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que le cookie est supprimé
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=.*Expires=Thu, 01 Jan 1970/);
    });
  });

  describe('Validation des tokens JWT', () => {
    it('devrait accepter un token valide dans les cookies', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('devrait accepter un token valide dans les headers', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('devrait rejeter un token invalide', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', 'token=invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it('devrait rejeter un token expiré', async () => {
      const expiredToken = jwt.sign(
        { user: { id: adminUser.id, email: adminUser.email, role: adminUser.role } },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Token expiré
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', `token=${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/expiré|expired/i);
    });

    it('devrait rejeter une requête sans token', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });
  });

  describe('Contrôle d\'accès par rôle', () => {
    describe('Routes admin (/api/admin/*)', () => {
      it('devrait permettre l\'accès aux administrateurs', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Cookie', `token=${adminToken}`);

        expect(response.status).not.toBe(403);
      });

      it('devrait refuser l\'accès aux managers', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Cookie', `token=${managerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/autorisé|authorized/i);
      });

      it('devrait refuser l\'accès aux employés', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Cookie', `token=${employeeToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/autorisé|authorized/i);
      });
    });

    describe('Routes générales protégées', () => {
      it('devrait permettre l\'accès aux utilisateurs authentifiés', async () => {
        const endpoints = [
          '/api/profile',
          '/api/companies',
          '/api/teams'
        ];

        for (const endpoint of endpoints) {
          const adminResponse = await request(app)
            .get(endpoint)
            .set('Cookie', `token=${adminToken}`);
          
          const managerResponse = await request(app)
            .get(endpoint)
            .set('Cookie', `token=${managerToken}`);
          
          const employeeResponse = await request(app)
            .get(endpoint)
            .set('Cookie', `token=${employeeToken}`);

          // Tous les rôles authentifiés devraient avoir accès
          expect(adminResponse.status).not.toBe(401);
          expect(managerResponse.status).not.toBe(401);
          expect(employeeResponse.status).not.toBe(401);
        }
      });
    });
  });

  describe('Sécurité des cookies', () => {
    it('devrait définir des cookies httpOnly sécurisés', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const tokenCookie = cookies[0];
      expect(tokenCookie).toMatch(/HttpOnly/);
      expect(tokenCookie).toMatch(/SameSite=Strict/);
      expect(tokenCookie).toMatch(/Path=\//);
      
      // En test, le cookie ne devrait pas être Secure
      expect(tokenCookie).not.toMatch(/Secure/);
    });
  });

  describe('Protection contre les attaques', () => {
    it('devrait résister aux tentatives de manipulation de rôle', async () => {
      // Tenter de créer un token avec un rôle non autorisé
      const maliciousToken = jwt.sign(
        { user: { id: employeeUser.id, email: employeeUser.email, role: 'admin' } },
        'wrong-secret', // Mauvaise clé de signature
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token=${maliciousToken}`);

      expect(response.status).toBe(401);
    });

    it('devrait valider la signature des tokens', async () => {
      // Token avec une signature invalide
      const tamperedToken = adminToken.slice(0, -5) + 'tampr';

      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', `token=${tamperedToken}`);

      expect(response.status).toBe(401);
    });

    it('devrait gérer les tokens malformés', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // Token incomplet
        'invalid-token-format',
        '' // Token vide
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/profile')
          .set('Cookie', `token=${token}`);

        expect(response.status).toBe(401);
      }
    });
  });
});