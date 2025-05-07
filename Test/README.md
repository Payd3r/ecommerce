# Test per il Progetto E-commerce

Questa cartella contiene i test unitari e di integrazione per il progetto e-commerce.

## Struttura

```
TEST/
  ├── backend/           # Test per il backend
  │   ├── __mocks__/     # Mock per i test backend
  │   │   ├── app.js     # Mock dell'app Express
  │   │   └── auth_functions.js # Mock delle funzioni di autenticazione
  │   ├── auth_functions.test.js
  │   ├── auth_api.test.js
  │   ├── products_api.test.js
  │   ├── cart_api.test.js
  │   └── auth.service.js
  ├── frontend/          # Test per il frontend
  │   ├── auth.service.test.js
  │   ├── router.test.js
  │   ├── login.integration.test.js
  │   └── dom.helper.js
  ├── jest.setup.js      # File di setup per Jest
  ├── package.json       # Dipendenze per i test
  └── README.md          # Questo file
```

## Prerequisiti

Prima di eseguire i test, assicurati di avere:

1. Node.js installato (versione 14 o superiore)
2. NPM o Yarn per installare le dipendenze

## Installazione

```bash
cd TEST
npm install
```

## Esecuzione dei test

### Tutti i test

```bash
npm test
```

### Solo test backend

```bash
npm run test:backend
```

### Solo test frontend

```bash
npm run test:frontend
```

## Note sui test

### Test Backend

I test backend utilizzano versioni mockate di:
- Express (app.js)
- Funzioni di autenticazione (auth_functions.js)

Questo approccio permette di eseguire i test senza dipendenze dal database o dall'applicazione reale.

### Test Frontend

I test frontend utilizzano l'ambiente JSDOM per simulare un browser. Questo permette di testare:
- Manipolazione del DOM
- Gestione di eventi
- Gestione dello stato dell'applicazione

## Troubleshooting

- Se riscontri errori relativi a `window` o `document`, verifica che l'ambiente di test sia impostato su `jsdom`
- Se riscontri errori relativi a moduli non trovati, verifica che tutte le dipendenze siano installate
- Se riscontri errori nei mock, verifica che i percorsi di importazione siano corretti

## Estendere i test

Per aggiungere nuovi test:

1. Crea un nuovo file con estensione `.test.js` nella cartella appropriata
2. Segui lo stesso pattern degli altri test
3. Assicurati di utilizzare i mock esistenti o di crearne di nuovi se necessario 