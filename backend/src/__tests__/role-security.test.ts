import request from 'supertest';
import app from '../app';
import User from '../models/User.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Tests de sécurité par rôle', () => {
  let users: Record<string, any> = {};
  let tokens: Record<string, string> = {};

  beforeEach(async () => {
    // Créer des utilisateurs pour chaque rôle
    const roles = ['admin', 'directeur', 'manager', 'employee'];

    for (const role of roles) {
      const user = await User.create({
        lastName: `User ${role}`,
        firstName: 'Test',
        email: `${role}@test.com`,
        password: 'password123',
        role: role
      });

      users[role] = user;
      tokens[role] = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );
    }
  });

  describe('Hiérarchie des rôles et permissions', () => {
    const roleHierarchy = {
      admin: 4,
      directeur: 3,
      manager: 2,
      employee: 1
    };

    it('devrait respecter la hiérarchie des rôles pour /api/admin/*', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/companies',
        '/api/admin/teams',
        '/api/admin/employees'
      ];

      for (const endpoint of adminEndpoints) {
        // Admin devrait avoir accès
        const adminResponse = await request(app)
          .get(endpoint)
          .set('Cookie', `token=${tokens.admin}`);
        expect(adminResponse.status).not.toBe(403);

        // Autres rôles ne devraient pas avoir accès
        for (const role of ['directeur', 'manager', 'employee']) {
          const response = await request(app)
            .get(endpoint)
            .set('Cookie', `token=${tokens[role]}`);
          expect(response.status).toBe(403);
        }
      }
    });

    it('devrait permettre l\'accès aux routes générales pour tous les rôles authentifiés', async () => {
      const generalEndpoints = [
        '/api/profile',
        '/api/companies',
        '/api/teams'
      ];

      for (const endpoint of generalEndpoints) {
        for (const role of Object.keys(tokens)) {
          const response = await request(app)
            .get(endpoint)
            .set('Cookie', `token=${tokens[role]}`);
          
          // Tous les rôles authentifiés devraient avoir accès (pas 401 ou 403)
          expect(response.status).not.toBe(401);
          expect(response.status).not.toBe(403);
        }
      }
    });
  });

  describe('Tests spécifiques par endpoint', () => {
    describe('GET /api/admin/employees', () => {
      it('devrait permettre l\'accès uniquement aux admins', async () => {
        const adminResponse = await request(app)
          .get('/api/admin/employees')
          .set('Cookie', `token=${tokens.admin}`);
        expect(adminResponse.status).not.toBe(403);

        const unauthorizedRoles = ['directeur', 'manager', 'employee'];
        for (const role of unauthorizedRoles) {
          const response = await request(app)
            .get('/api/admin/employees')
            .set('Cookie', `token=${tokens[role]}`);
          expect(response.status).toBe(403);
        }
      });
    });

    describe('POST /api/admin/employees', () => {
      it('devrait permettre la création d\'employés uniquement aux admins', async () => {
        const newEmployee = {
          lastName: 'Nouvel',
          firstName: 'Employé',
          email: 'nouvel@test.com',
          role: 'employee'
        };

        const adminResponse = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${tokens.admin}`)
          .send(newEmployee);
        expect(adminResponse.status).not.toBe(403);

        const unauthorizedRoles = ['directeur', 'manager', 'employee'];
        for (const role of unauthorizedRoles) {
          const response = await request(app)
            .post('/api/admin/employees')
            .set('Cookie', `token=${tokens[role]}`)
            .send(newEmployee);
          expect(response.status).toBe(403);
        }
      });
    });

    describe('DELETE /api/admin/employees/:id', () => {
      it('devrait permettre la suppression uniquement aux admins', async () => {
        const employeeId = users.employee._id;

        const unauthorizedRoles = ['directeur', 'manager', 'employee'];
        for (const role of unauthorizedRoles) {
          const response = await request(app)
            .delete(`/api/admin/employees/${employeeId}`)
            .set('Cookie', `token=${tokens[role]}`);
          expect(response.status).toBe(403);
        }

        // Admin devrait pouvoir supprimer
        const adminResponse = await request(app)
          .delete(`/api/admin/employees/${employeeId}`)
          .set('Cookie', `token=${tokens.admin}`);
        expect(adminResponse.status).not.toBe(403);
      });
    });
  });

  describe('Protection contre l\'escalade de privilèges', () => {
    it('ne devrait pas permettre à un utilisateur de modifier son propre rôle', async () => {
      const updateData = {
        role: 'admin' // Tentative d'escalade
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Cookie', `token=${tokens.employee}`)
        .send(updateData);

      // La requête ne devrait pas changer le rôle
      expect(response.status).not.toBe(200);
    });

    it('ne devrait pas permettre la création d\'utilisateurs admin par des non-admins', async () => {
      const newAdmin = {
        lastName: 'Faux',
        firstName: 'Admin',
        email: 'faux-admin@test.com',
        role: 'admin'
      };

      const unauthorizedRoles = ['directeur', 'manager', 'employee'];
      for (const role of unauthorizedRoles) {
        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${tokens[role]}`)
          .send(newAdmin);
        expect(response.status).toBe(403);
      }
    });
  });

  describe('Validation des données de rôle', () => {
    it('devrait rejeter les rôles invalides', async () => {
      const invalidRoles = ['super-admin', 'root', 'moderator', '', null, undefined];

      for (const invalidRole of invalidRoles) {
        const userData = {
          lastName: 'Test',
          firstName: 'User',
          email: `test-${Date.now()}@test.com`,
          role: invalidRole
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${tokens.admin}`)
          .send(userData);

        if (invalidRole) {
          // Devrait rejeter les rôles invalides
          expect(response.status).toBe(400);
        }
      }
    });

    it('devrait valider que les rôles sont dans la liste autorisée', async () => {
      const validRoles = ['admin', 'directeur', 'manager', 'employee'];

      for (const validRole of validRoles) {
        const userData = {
          lastName: 'Test',
          firstName: 'User',
          email: `test-${validRole}-${Date.now()}@test.com`,
          role: validRole
        };

        const response = await request(app)
          .post('/api/admin/employees')
          .set('Cookie', `token=${tokens.admin}`)
          .send(userData);

        // Les rôles valides devraient être acceptés
        expect(response.status).not.toBe(400);
      }
    });
  });

  describe('Isolation des données par entreprise', () => {
    let userOtherCompany: any;
    let tokenOtherCompany: string;

    beforeEach(async () => {
      // Créer un utilisateur d'une autre entreprise
      userOtherCompany = await User.create({
        lastName: 'External',
        firstName: 'User',
        email: 'external@other-company.com',
        password: 'password123',
        role: 'admin'
      });

      tokenOtherCompany = jwt.sign(
        { userId: userOtherCompany._id, email: userOtherCompany.email, role: userOtherCompany.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );
    });

    it('devrait isoler les données par entreprise', async () => {
      // Un admin d'une entreprise ne devrait pas voir les données d'une autre entreprise
      const response = await request(app)
        .get('/api/employees')
        .set('Cookie', `token=${tokenOtherCompany}`);

      expect(response.status).toBe(200);
      
      // Les données retournées ne devraient contenir que les employés de "Other Corp"
      if (response.body.length > 0) {
        response.body.forEach((employee: any) => {
          expect(employee.entreprise).toBe('Other Corp');
        });
      }
    });
  });
});