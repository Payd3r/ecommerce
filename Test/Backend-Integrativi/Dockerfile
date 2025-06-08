FROM node:20-alpine

WORKDIR /usr/src/app

# Copia i file package per l'installazione delle dipendenze
COPY ./Test/Backend-Integrativi/package*.json ./Test/Backend-Integrativi/

# Installa dipendenze di test (incluse devDependencies)
WORKDIR /usr/src/app/Test/Backend-Integrativi  
RUN npm install --include=dev

# Copia i file di test e configurazione
COPY ./Test/Backend-Integrativi/ ./

# Installa mysql2 per db-setup nella directory Test
WORKDIR /usr/src/app/Test
RUN npm init -y && npm install mysql2

# Crea cartella output con permessi
RUN mkdir -p /usr/src/app/Test/Output && chmod -R 777 /usr/src/app/Test/Output

# Installa netcat per health checks
RUN apk add --no-cache netcat-openbsd

# Crea script di avvio semplificato
RUN echo '#!/bin/sh' > /usr/src/app/start-tests.sh && \
    echo 'echo "Starting integration tests..."' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Waiting for database..."' >> /usr/src/app/start-tests.sh && \
    echo 'until nc -z mariadb-test-db 3307; do sleep 2; done' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Waiting for backend API..."' >> /usr/src/app/start-tests.sh && \
    echo 'until nc -z backend-test 3001; do sleep 2; done' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Database and API ready, initializing..."' >> /usr/src/app/start-tests.sh && \
    echo 'cd /usr/src/app/Test && node db-setup.js init' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Running tests..."' >> /usr/src/app/start-tests.sh && \
    echo 'cd /usr/src/app/Test/Backend-Integrativi && npm test' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Tests completed"' >> /usr/src/app/start-tests.sh && \
    chmod +x /usr/src/app/start-tests.sh

WORKDIR /usr/src/app/Test/Backend-Integrativi

CMD ["/usr/src/app/start-tests.sh"] 