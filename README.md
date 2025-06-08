# Pane e Salame - E-commerce di Artigianato

## Membri del Team
- Luca Cattaneo 755083
- Andrea Mauri 755140

---

## Descrizione
Piattaforma e-commerce per la vendita di prodotti artigianali, sviluppata per l'Esame Pratico di Tecnologie Innovative.  
Il progetto è suddiviso in:
- **Frontend**: HTML, CSS, JavaScript (modulare), Bootstrap, Chart.js, Stripe.js
- **Backend**: Node.js, Express.js, MariaDB/MySQL, Swagger per la documentazione API
- **Monitoring**: per il sistema di monitoraggio e gestione dei dati
- **Test**: per l'esecuzione dei test automatici e manuali
---

## Prerequisiti

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) **(consigliato)**
- In alternativa: Node.js (v18+), npm, e un database MariaDB/MySQL


---

## Configurazione e Avvio Locale (con Docker)

### Ambiente di Produzione

1. **Clona la repository**
   ```bash
   git clone <url-repo>
   cd ecommerce
   ```

2. **Avvia tutti i servizi di produzione**
   ```bash
   docker-compose up --build -d
   ```
   Questo comando:
   - Crea e avvia i container per database, backend, frontend e image server
   - Esegue automaticamente la configurazione del database tramite `/Backend/db.sql`
   - Espone i servizi sulle seguenti porte:
     - **Frontend**: [http://localhost:3010](http://localhost:3010)
     - **Backend/API**: [http://localhost:3015](http://localhost:3015)
     - **Database MariaDB**: porta 3306
     - **Image server**: [http://localhost:8080/Media](http://localhost:8080/Media)

3. **Accesso rapido**
   - **Frontend**: [http://localhost:3010](http://localhost:3010)
   - **Documentazione API (Swagger)**: [http://localhost:3015/api-docs](http://localhost:3015/api-docs)
   - **Dashboard Monitoraggio**: [http://localhost:3017](http://localhost:3017)

### Ambiente di Testing

Il progetto include un sistema di testing completo con configurazione Docker separata per evitare conflitti con l'ambiente di produzione.

#### Esecuzione dei Test

**Opzione 1: Script automatico (consigliato)**
```bash
# Esegui tutti i test
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1

# Esegui solo test specifici
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 unitari
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 integrativi
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 frontend
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 performance

# Pulisci i container di test
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 clean

# Mostra aiuto
powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 help
```

**Opzione 2: Docker Compose manuale**
```bash
# Test unitari (non richiedono infrastruttura)
docker-compose -f docker-compose-testing.yml run --rm test-unitari

# Test integrativi (richiedono backend e database di test)
docker-compose -f docker-compose-testing.yml up -d db-test backend-test
docker-compose -f docker-compose-testing.yml run --rm test-integrativi

# Test frontend
docker-compose -f docker-compose-testing.yml run --rm test-frontend

# Test performance
docker-compose -f docker-compose-testing.yml run --rm test-performance

# Pulizia
docker-compose -f docker-compose-testing.yml down --volumes --remove-orphans
```

#### Tipi di Test Disponibili

1. **Test Unitari**: Test isolati delle funzioni di business logic
2. **Test Integrativi**: Test delle API REST con database di test
3. **Test Frontend**: Test dei componenti e dell'interfaccia utente
4. **Test Performance**: Load testing e benchmark delle API

#### Risultati dei Test

I risultati dei test vengono salvati nella cartella `./Test/Output/` in formato JSON e HTML per una facile consultazione.

#### Configurazione Test

L'ambiente di testing utilizza:
- **Database di test**: MariaDB su porta 3307 con dati temporanei
- **Backend di test**: Node.js configurato per l'ambiente di test
- **Frontend di test**: Build ottimizzata per testing
- **Configurazioni isolate**: Nessun conflitto con l'ambiente di produzione

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

## Credenziali di Test e Pagamenti

Per testare le funzionalità della piattaforma sono disponibili i seguenti account di esempio:

- **Account Artigiano**:  
  Email: `enrico@example.com`  
  Password: `1234`
- **Account Admin**:  
  Email: `luca@gmail.com`  
  Password: `1234`
- **Account Cliente**:  
  Email: `antonio@example.com`  
  Password: `1234`

Per testare i pagamenti con carta, utilizzare le carte di test fornite da Stripe.  
Consulta la documentazione ufficiale per i numeri di carta e i casi d'uso:
- [Carte di test Stripe e scenari di pagamento](https://docs.stripe.com/testing?locale=it-IT)

---

## Sistema di Monitoraggio e Integrazione Continua

La piattaforma include un sistema completo di monitoraggio per soddisfare i requisiti di **integrazione continua e monitoraggio dell'applicazione in produzione**.

### Dashboard di Monitoraggio

- **Accesso**: [http://localhost:3017](http://localhost:3017)
- **Funzionalità**:
  - Monitoraggio stato container Docker in tempo reale
  - Utilizzo CPU e memoria del sistema
  - Occupazione spazio storage (cartella Media e progetto)
  - Grafici in tempo reale con aggiornamenti automatici
  - Top processi di sistema
  - Statistiche di rete e I/O

### Caratteristiche del Sistema di Monitoraggio

1. **Dashboard Web Interattiva**
   - Interfaccia moderna con Bootstrap 5
   - Aggiornamenti in tempo reale tramite WebSocket
   - Grafici dinamici con Chart.js
   - Layout responsive per dispositivi mobili

2. **Metriche Monitorate**
   - **Container Docker**: Stato, utilizzo CPU/memoria per container, I/O di rete e disco
   - **Sistema**: CPU, memoria, processi, informazioni hardware
   - **Storage**: Dimensione cartella Media, utilizzo spazio totale progetto
   - **Rete**: Traffico in ingresso/uscita per container

3. **API REST**
   - `/api/health` - Health check del servizio
   - `/api/metrics` - Tutte le metriche
   - `/api/metrics/docker` - Solo metriche Docker
   - `/api/metrics/system` - Solo metriche sistema
   - `/api/metrics/storage` - Solo metriche storage

4. **Aggiornamenti Automatici**
   - WebSocket per aggiornamenti real-time
   - Fallback HTTP ogni 15 secondi
   - Cronaca metriche ogni 10 secondi

### Configurazione per Accesso Pubblico

Per esporre il sistema su rete pubblica attraverso il router:

1. **Port Forwarding sul Router**
   ```
   Porta Esterna -> Porta Interna (IP Locale)
   3010 -> 3010  (Frontend)
   3015 -> 3015  (Backend API)
   3017 -> 3017  (Dashboard Monitoraggio)
   8080 -> 8080  (Image Server)
   ```

2. **Sicurezza Consigliata**
   - Configurare firewall per limitare accessi
   - Utilizzare VPN per accesso amministrativo
   - Implementare autenticazione per dashboard produzione
   - Monitorare log di accesso

3. **DNS e Domini**
   - Configurare Dynamic DNS se IP pubblico dinamico
   - Utilizzare reverse proxy (nginx) per gestione domini
   - Certificati SSL per connessioni sicure

### Integrazione con Testing

Il sistema di monitoraggio è disponibile anche nell'ambiente di testing:
- **Testing Environment**: [http://localhost:3018](http://localhost:3018)
- Configurazione isolata per non interferire con produzione
- Metriche specifiche per container di test

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
├── docker-compose.yml           # Configurazione produzione
├── docker-compose-testing.yml  # Configurazione testing
├── run-tests.ps1              # Script PowerShell per eseguire i test
├── README.md
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
│   ├── Media/                  # Directory per il backup locale delle immagini
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
├── Media/                       # Volume condiviso per immagini pubbliche
│
├── Backups/                     # Directory per i backup del sistema
│
├── Documenti/                   # Documentazione aggiuntiva e risorse
│
├── Monitoring/                  # Sistema di monitoraggio
│   ├── public/                  # Frontend della dashboard
│   ├── services/               # Servizi di monitoraggio
│   ├── safe-versions/          # Versioni di backup sicure
│   ├── server.js               # Server di monitoraggio
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
│
└── Test/                        # Suite di test completa
    ├── Backend-Unitari/         # Test unitari backend
    ├── Backend-Integrativi/     # Test integrativi API
    ├── Frontend/                # Test frontend
    ├── Performance/             # Test di performance
    └── Output/                  # Risultati dei test
```

---

## Sistema di Backup e Ripristino

Il progetto include un sistema completo di backup e ripristino per garantire la sicurezza dei dati.

### Backup Automatici

- **Backup Media**: Backup automatico giornaliero delle immagini nella cartella `Backups/`
- **Backup Database**: Backup automatico del database MariaDB
- **Versioni Sicure**: Copie di sicurezza delle configurazioni critiche in `Monitoring/safe-versions/`

### Gestione dei Backup

1. **Backup Manuale**
   ```powershell
   # Esegue un backup completo
   powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 backup
   ```

2. **Ripristino da Backup**
   ```powershell
   # Ripristina l'ultimo backup disponibile
   powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 restore
   ```

3. **Verifica Integrità**
   ```powershell
   # Verifica l'integrità dei backup
   powershell -ExecutionPolicy Bypass -File ./run-tests.ps1 verify-backup
   ```

### Dashboard di Gestione Dati

La dashboard di monitoraggio include una sezione dedicata alla gestione dei dati:

- **Stato Backup**: Visualizzazione dello stato dei backup
- **Ripristino**: Interfaccia per il ripristino da backup
- **Log Operazioni**: Storico delle operazioni di backup/ripristino
- **Spazio Occupato**: Monitoraggio dello spazio utilizzato dai backup

### Sicurezza dei Backup

- Crittografia dei backup sensibili
- Rotazione automatica dei backup (mantenimento ultimi 7 giorni)
- Verifica dell'integrità dei file di backup
- Backup incrementali per ottimizzare lo spazio

---

## Documentazione Aggiuntiva

La cartella `Documenti/` contiene risorse aggiuntive per lo sviluppo e la manutenzione del progetto:

- **Guide Tecniche**: Documentazione dettagliata delle API e dei servizi
- **Diagrammi**: Architettura del sistema e flussi di dati
- **Procedure**: Guide per operazioni comuni e troubleshooting
- **Standard**: Linee guida per lo sviluppo e la manutenzione

---

## Servizi Docker

### Produzione (docker-compose.yml)
- **frontend**: Porta 3010 - Interfaccia utente
- **backend**: Porta 3015 - API REST
- **db**: Porta 3306 - Database MariaDB
- **imageserver**: Porta 8080 - Server per immagini statiche
- **monitoring**: Porta 3017 - Dashboard di monitoraggio

### Testing (docker-compose-testing.yml)
- **frontend-test**: Frontend per test
- **backend-test**: Backend per test
- **db-test**: Porta 3307 - Database di test MariaDB
- **test-unitari**: Container per test unitari
- **test-integrativi**: Container per test integrativi
- **test-frontend**: Container per test frontend
- **test-performance**: Container per test performance
- **monitoring-test**: Porta 3018 - Dashboard monitoraggio per test

---

## Troubleshooting

### Problemi Comuni

1. **Porte già in uso**: Modifica le porte nei file docker-compose se necessario
2. **Permessi script**: Su sistemi Unix, rendi eseguibile lo script: `chmod +x run-tests.ps1`
3. **Container orfani**: Pulisci con `