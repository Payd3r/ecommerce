# ArtigianatoShop - E-commerce di Artigianato

## Membri del Team
- Luca Cattaneo 755083
- Andrea Mauri 755140

---

## Descrizione
Piattaforma e-commerce per la vendita di prodotti artigianali, sviluppata per l'Esame Pratico di Tecnologie Innovative.  
Il progetto è suddiviso in:
- **Frontend**: HTML, CSS, JavaScript (modulare), Bootstrap, Chart.js, Stripe.js
- **Backend**: Node.js, Express.js, MariaDB/MySQL, Swagger per la documentazione API

---

## Prerequisiti

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) **(consigliato)**
- In alternativa: Node.js (v18+), npm, e un database MariaDB/MySQL

---

## Configurazione e Avvio Locale (con Docker)

1. **Clona la repository**
   ```bash
   git clone <url-repo>
   cd ecommerce
   ```

2. **Avvia tutti i servizi**
   ```bash
   docker-compose up --build
   ```
   Questo comando:
   - Crea e avvia i container per database, backend, frontend e image server
   - Esegue automaticamente la configurazione del database tramite `/Backend/db.sql`
   - Espone i servizi sulle seguenti porte:
     - **Frontend**: [http://localhost:3010](http://localhost:3010)
     - **Backend/API**: [http://localhost:3015](http://localhost:3015)
     - **Swagger API Docs**: [http://localhost:3015/api-docs](http://localhost:3015/api-docs)
     - **Image server**: [http://localhost:8080/Media](http://localhost:8080/Media)

3. **Accesso rapido**
   - Frontend: [http://localhost:3010](http://localhost:3010)
   - Documentazione API (Swagger): [http://localhost:3015/api-docs](http://localhost:3015/api-docs)

---

## Deploy in Cloud

Il progetto è già pronto per il deploy su qualsiasi piattaforma che supporti Docker Compose (es. AWS ECS, Azure Container Apps, Google Cloud Run, Railway, Render, ecc.).

**Passaggi generali:**
1. Carica l'intera cartella del progetto su una VM/server/cloud provider.
2. Assicurati che Docker e Docker Compose siano installati.
3. Lancia:
   ```bash
   docker-compose up --build -d
   ```
4. Configura i DNS e le regole di firewall per esporre le porte desiderate.

**Nota:**  
Le credenziali del database e le variabili d'ambiente sono già impostate nel file `docker-compose.yml`.  
Per ambienti di produzione, si consiglia di modificarle e gestirle tramite secret manager o variabili d'ambiente esterne.

---

## Configurazione Manuale (senza Docker)

1. **Database**
   - Crea un database MariaDB/MySQL.
   - Importa `/Backend/db.sql` per creare tabelle e dati di esempio.

2. **Backend**
   - Modifica le variabili d'ambiente nel file `docker-compose.yml` o crea un file `.env` in `/Backend` con:
     ```
     PORT=3015
     DB_HOST=<host>
     DB_USER=<user>
     DB_PASSWORD=<password>
     DB_NAME=<db_name>
     DB_PORT=3306
     JWT_SECRET=<una_secret>
     ```
   - Installa le dipendenze:
     ```bash
     cd Backend
     npm install
     npm run dev
     ```
   - Il backend sarà disponibile su `http://localhost:3015`.

3. **Frontend**
   - Apri `/Frontend/index.html` in un browser, oppure servi la cartella con un web server statico (es. nginx).

---

## Documentazione delle API

- **Swagger**:  
  Tutte le API REST sono documentate e testabili tramite interfaccia Swagger, accessibile su  
  [http://localhost:3015/api-docs](http://localhost:3015/api-docs)

- **Esempio di endpoint documentati**:
  - `/auth/register` - Registrazione utente
  - `/auth/login` - Login utente
  - `/products` - Gestione prodotti
  - `/orders` - Gestione ordini
  - `/cart` - Gestione carrello
  - `/users` - Gestione utenti
  - `/images/upload/product` - Upload immagini prodotto
  - `/categories` - Gestione categorie
  - `/issues` - Segnalazioni utenti

  Consulta Swagger per dettagli su parametri, request/response e autenticazione.

---

## Struttura del Progetto

```
ecommerce/
│
├── docker-compose.yml
├── README.md
├── start.sh
├── .gitignore
├── .gitattributes
│
├── Backend/
│   ├── app.js
│   ├── db.sql
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── .dockerignore
│   ├── .gitignore
│   ├── models/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── cart.js
│   │   ├── categories.js
│   │   ├── images.js
│   │   ├── address.js
│   │   └── issue.js
│   ├── services/
│   └── middleware/
│
├── Frontend/
│   ├── index.html
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── css/
│   │   ├── loader.css
│   │   ├── productCard.css
│   │   ├── categoryCard.css
│   │   ├── artisanCard.css
│   │   ├── filters.css
│   │   └── page.css
│   ├── js/
│   │   ├── main.js
│   │   ├── router.js
│   │   ├── assets.geo.js
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   │       ├── fetchWithAuth.js
│   │       └── authService.js
│   └── api/
│
├── Media/                    # volume condiviso per immagini pubbliche
│
└── Test/
```

---

## Note Tecniche

- **Frontend**:  
  - Utilizza JS modulare (`/js/main.js`, `/js/router.js`, `/js/services/`)
  - Bootstrap per la UI, Chart.js per grafici, Stripe.js per pagamenti
  - Tutte le chiamate API sono documentate nei servizi JS

- **Backend**:  
  - Express.js, MariaDB/MySQL, JWT per autenticazione
  - Documentazione API automatica con Swagger (commenti JSDoc nelle route)
  - Gestione immagini tramite volume condiviso `/Media` e image server dedicato

- **Database**:  
  - Struttura e dati di esempio definiti in `/Backend/db.sql`

---

## Riferimenti e Approfondimenti

- [Swagger UI - Documentazione API](http://localhost:3015/api-docs)
- Commenti dettagliati nei file JS e nelle route Express
