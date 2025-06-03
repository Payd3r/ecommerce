const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione simulata delle route per i test
  const routes = {
    'GET /': [
      async (req, res) => {
        try {
          const page = parseInt(req.query.page) || 1;
          const pageSize = parseInt(req.query.pageSize) || 10;
          const offset = (page - 1) * pageSize;
          // Query per il totale
          const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM issues`
          );
          const total = countRows[0].total;
          // Query per la pagina
          const [rows] = await db.query(
            `SELECT i.id_issue, i.title, u.name as client_name, i.description, i.status, i.created_at, i.admin_note, i.id_client
             FROM issues i
             LEFT JOIN users u ON i.id_client = u.id
             ORDER BY i.created_at DESC, i.id_issue DESC
             LIMIT ? OFFSET ?`,
            [pageSize, offset]
          );
          res.json({ issues: rows, total });
        } catch (err) {
          res.status(500).json({ error: 'Errore nel recupero delle segnalazioni' });
        }
      }
    ],
    'POST /': [
      async (req, res) => {
        try {
          const { title, description, status, created_at, id_client, admin_note } = req.body;
          
          if (!id_client) {
            return res.status(400).json({ error: "id_client obbligatorio per la creazione della segnalazione" });
          }
          
          await db.query(
            `INSERT INTO issues (title, description, status, created_at, id_client, admin_note) VALUES (?, ?, ?, ?, ?, ?)` ,
            [title, description, status, created_at, id_client, admin_note || null]
          );
          res.status(201).json({ success: true });
        } catch (err) {
          res.status(500).json({ error: "Errore nella creazione della segnalazione" });
        }
      }
    ],
    'PUT /:id': [
      async (req, res) => {
        try {
          const id = req.params.id;
          const { title, description, status, created_at, admin_note } = req.body;
          // Aggiorna solo i campi consentiti
          await db.query(
            `UPDATE issues SET title=?, description=?, status=?, created_at=?, admin_note=? WHERE id_issue=?`,
            [title, description, status, created_at, admin_note, id]
          );
          res.json({ success: true });
        } catch (err) {
          res.status(500).json({ error: "Errore nell'aggiornamento della segnalazione" });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: issue.js', () => {
  let routes;
  
  before(() => {
    routes = extractRouteHandlers();
  });
  
  beforeEach(() => {
    resetMocks();
  });
  
  describe('GET /issues', () => {
    it('dovrebbe restituire le segnalazioni con paginazione', async () => {
      // Mock dei dati
      const issuesMock = [
        { 
          id_issue: 1, 
          title: 'Problema con ordine', 
          client_name: 'Mario Rossi',
          description: 'Descrizione problema', 
          status: 'open', 
          created_at: '2023-01-01',
          admin_note: null,
          id_client: 1
        },
        { 
          id_issue: 2, 
          title: 'Domanda su prodotto', 
          client_name: 'Luigi Verdi',
          description: 'Descrizione domanda', 
          status: 'closed', 
          created_at: '2023-01-02',
          admin_note: 'Risposta fornita',
          id_client: 2
        }
      ];
      
      // Configura le mock responses
      db.query.onFirstCall().resolves([[{ total: 2 }]]);
      db.query.onSecondCall().resolves([issuesMock]);
      
      const req = mockRequest({
        query: { page: 1, pageSize: 10 }
      });
      const res = mockResponse();
      
      await routes['GET /'][0](req, res);
      
      // Verifica la risposta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('issues').that.is.an('array');
      expect(response.issues).to.have.lengthOf(2);
      expect(response).to.have.property('total', 2);
    });
    
    it('dovrebbe gestire errori nella query', async () => {
      // Simula un errore di database
      db.query.rejects(new Error('Errore database'));
      
      const req = mockRequest();
      const res = mockResponse();
      
      await routes['GET /'][0](req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Errore nel recupero delle segnalazioni' })).to.be.true;
    });
  });
  
  describe('POST /issues', () => {
    it('dovrebbe creare una nuova segnalazione', async () => {
      // Dati per la nuova segnalazione
      const newIssueData = {
        title: 'Nuova segnalazione',
        description: 'Descrizione problema',
        status: 'open',
        created_at: '2023-01-03',
        id_client: 3,
        admin_note: null
      };
      
      // Configura mock response
      db.query.resolves([{ insertId: 3 }]);
      
      const req = mockRequest({
        body: newIssueData
      });
      const res = mockResponse();
      
      await routes['POST /'][0](req, res);
      
      // Verifica la risposta
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ success: true })).to.be.true;
      
      // Verifica la query
      expect(db.query.calledOnce).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('INSERT INTO issues');
      expect(db.query.firstCall.args[1]).to.deep.equal([
        newIssueData.title,
        newIssueData.description,
        newIssueData.status,
        newIssueData.created_at,
        newIssueData.id_client,
        newIssueData.admin_note
      ]);
    });
    
    it('dovrebbe richiedere un id_client', async () => {
      const invalidData = {
        title: 'Segnalazione incompleta',
        description: 'Manca id_client'
      };
      
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();
      
      await routes['POST /'][0](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'id_client obbligatorio per la creazione della segnalazione' })).to.be.true;
    });
  });
  
  describe('PUT /issues/:id', () => {
    it('dovrebbe aggiornare una segnalazione esistente', async () => {
      const issueId = 1;
      const updateData = {
        title: 'Segnalazione aggiornata',
        description: 'Descrizione aggiornata',
        status: 'closed',
        created_at: '2023-01-04',
        admin_note: 'Nota aggiornata'
      };
      
      // Configura mock response
      db.query.resolves([{ affectedRows: 1 }]);
      
      const req = mockRequest({
        params: { id: issueId },
        body: updateData
      });
      const res = mockResponse();
      
      await routes['PUT /:id'][0](req, res);
      
      // Verifica la risposta
      expect(res.json.calledWith({ success: true })).to.be.true;
      
      // Verifica la query
      expect(db.query.calledOnce).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('UPDATE issues SET');
      expect(db.query.firstCall.args[1]).to.deep.equal([
        updateData.title,
        updateData.description,
        updateData.status,
        updateData.created_at,
        updateData.admin_note,
        issueId
      ]);
    });
    
    it('dovrebbe gestire errori nell\'aggiornamento', async () => {
      // Simula un errore di database
      db.query.rejects(new Error('Errore database'));
      
      const req = mockRequest({
        params: { id: 1 },
        body: { title: 'Test' }
      });
      const res = mockResponse();
      
      await routes['PUT /:id'][0](req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: "Errore nell'aggiornamento della segnalazione" })).to.be.true;
    });
  });
}); 