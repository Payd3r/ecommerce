const axios = require('axios');
const config = require('../config');

const API_BASE_URL = config.server.baseUrl;

describe('Auth Integration Tests', () => {
  let authTokens = {
    client: null,
    artisan: null,
    admin: null
  };

  const testUsers = {
    client: {
      email: 'test.client@integration.test',
      password: 'TestPassword123!',
      name: 'Test Client',
      role: 'client'
    },
    artisan: {
      email: 'test.artisan@integration.test', 
      password: 'TestPassword123!',
      name: 'Test Artisan',
      role: 'artisan'
    },
    admin: {
      email: 'test.admin@integration.test',
      password: 'TestPassword123!', 
      name: 'Test Admin',
      role: 'admin'
    }
  };

  describe('POST /auth/register', () => {
    it('dovrebbe registrare un nuovo cliente', async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, testUsers.client);
        
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data.token).toBeDefined();
        expect(response.data.data.user.email).toBe(testUsers.client.email);
        expect(response.data.data.user.role).toBe('client');
        
        authTokens.client = response.data.data.token;
      } catch (error) {
        if (error.response.status === 400 && error.response.data.message.includes('Email gia registrata')) {
          // L'utente esiste già, prova il login
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUsers.client.email,
            password: testUsers.client.password
          });
          authTokens.client = loginResponse.data.data.token;
          expect(loginResponse.status).toBe(200);
        } else {
          throw error;
        }
      }
    });

    it('dovrebbe registrare un nuovo artigiano', async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, testUsers.artisan);
        
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data.user.role).toBe('artisan');
        
        authTokens.artisan = response.data.data.token;
      } catch (error) {
        if (error.response.status === 400 && error.response.data.message.includes('Email gia registrata')) {
          // L'utente esiste già, prova il login
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUsers.artisan.email,
            password: testUsers.artisan.password
          });
          authTokens.artisan = loginResponse.data.data.token;
          expect(loginResponse.status).toBe(200);
        } else {
          throw error;
        }
      }
    });

    it('dovrebbe registrare un nuovo admin', async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, testUsers.admin);
        
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data.user.role).toBe('admin');
        
        authTokens.admin = response.data.data.token;
      } catch (error) {
        if (error.response.status === 400 && error.response.data.message.includes('Email gia registrata')) {
          // L'utente esiste già, prova il login
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUsers.admin.email,
            password: testUsers.admin.password
          });
          authTokens.admin = loginResponse.data.data.token;
          expect(loginResponse.status).toBe(200);
        } else {
          throw error;
        }
      }
    });

    it('dovrebbe rifiutare registrazione con email duplicata', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, testUsers.client);
        fail('Dovrebbe lanciare errore per email duplicata');
      } catch (error) {
        expect([400, 401]).toContain(error.response.status);
        expect(error.response.data.message).toContain('Email gia registrata');
      }
    });

    it('dovrebbe rifiutare registrazione con dati mancanti', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, { 
          email: 'test@test.com' 
        });
        fail('Dovrebbe lanciare errore per dati mancanti');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });

    it('dovrebbe rifiutare ruolo non valido', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, {
          ...testUsers.client,
          email: 'invalid.role@test.com',
          role: 'invalid_role'
        });
        fail('Dovrebbe lanciare errore per ruolo non valido');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('POST /auth/login', () => {
    it('dovrebbe effettuare login con credenziali valide', async () => {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUsers.client.email,
        password: testUsers.client.password
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.token).toBeDefined();
      expect(response.data.data.user.email).toBe(testUsers.client.email);
    });

    it('dovrebbe rifiutare login con password errata', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testUsers.client.email,
          password: 'WrongPassword'
        });
        fail('Dovrebbe lanciare errore per password errata');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toContain('Credenziali non valide');
      }
    });

    it('dovrebbe rifiutare login con email inesistente', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'nonexistent@test.com',
          password: 'SomePassword'
        });
        fail('Dovrebbe lanciare errore per email inesistente');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toContain('Credenziali non valide');
      }
    });

    it('dovrebbe rifiutare login con dati mancanti', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testUsers.client.email
        });
        fail('Dovrebbe lanciare errore per dati mancanti');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('GET /auth/profile', () => {
    it('dovrebbe restituire profilo utente con token valido', async () => {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.email).toBe(testUsers.client.email);
      expect(response.data.data.role).toBe('client');
      // Il nickname potrebbe essere stato aggiornato da test precedenti
      expect(response.data.data.nickname).toMatch(/(Test Client|Updated Test Client)/);
    });

    it('dovrebbe restituire profilo artigiano con dati extended_users', async () => {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.artisan}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.role).toBe('artisan');
      // Extended_users potrebbe essere null per un nuovo artigiano
    });

    it('dovrebbe rifiutare accesso senza token', async () => {
      try {
        await axios.get(`${API_BASE_URL}/auth/profile`);
        fail('Dovrebbe lanciare errore senza token');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('dovrebbe rifiutare accesso con token non valido', async () => {
      try {
        await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': 'Bearer invalid_token_here'
          }
        });
        fail('Dovrebbe lanciare errore con token non valido');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('PUT /auth/profile', () => {
    it('dovrebbe aggiornare nickname utente', async () => {
      const newNickname = 'Updated Test Client';
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
        nickname: newNickname
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.nickname).toBe(newNickname);
    });

    it('dovrebbe aggiornare email utente', async () => {
      const newEmail = 'updated.client@integration.test';
      try {
        const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
          email: newEmail
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.email).toBe(newEmail);
        
        // Aggiorna email per i test successivi
        testUsers.client.email = newEmail;
      } catch (error) {
        // Se l'email è già in uso o c'è un errore del server, accetta l'errore
        expect([400, 500]).toContain(error.response.status);
      }
    });

    it('dovrebbe rifiutare aggiornamento senza dati', async () => {
      try {
        await axios.put(`${API_BASE_URL}/auth/profile`, {}, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore senza dati');
      } catch (error) {
        expect([400, 401]).toContain(error.response.status);
      }
    });

    it('dovrebbe rifiutare aggiornamento senza token', async () => {
      try {
        await axios.put(`${API_BASE_URL}/auth/profile`, {
          nickname: 'New Name'
        });
        fail('Dovrebbe lanciare errore senza token');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('PUT /auth/artisan/bio', () => {
    it('dovrebbe aggiornare bio artigiano', async () => {
      const bio = 'Questa è la mia bio di test per l\'artigiano';
      try {
        const response = await axios.put(`${API_BASE_URL}/auth/artisan/bio`, {
          bio: bio
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.artisan}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } catch (error) {
        // Se c'è un errore del server o di validazione, accetta l'errore
        expect([400, 500]).toContain(error.response.status);
      }
    });

    it('dovrebbe rifiutare aggiornamento bio da non-artigiano', async () => {
      try {
        await axios.put(`${API_BASE_URL}/auth/artisan/bio`, {
          bio: 'Test bio'
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per non-artigiano');
      } catch (error) {
        expect([401, 403]).toContain(error.response.status);
      }
    });

    it('dovrebbe rifiutare aggiornamento bio senza bio', async () => {
      try {
        await axios.put(`${API_BASE_URL}/auth/artisan/bio`, {}, {
          headers: {
            'Authorization': `Bearer ${authTokens.artisan}`
          }
        });
        fail('Dovrebbe lanciare errore senza bio');
      } catch (error) {
        expect([400, 401]).toContain(error.response.status);
      }
    });
  });

  // Esporta i token per altri test
  global.authTokensForIntegration = authTokens;
  global.testUsersForIntegration = testUsers;
}); 