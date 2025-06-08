FROM node:20-alpine

WORKDIR /usr/src/app

# Copia solo i file di test necessari
COPY . .

# Installa dipendenze di test
WORKDIR /usr/src/app/Test/Backend-Integrativi  
RUN npm install

# Installa mysql2 per db-setup nella root
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
    echo 'until nc -z db-test 3016; do sleep 2; done' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Waiting for backend API..."' >> /usr/src/app/start-tests.sh && \
    echo 'until nc -z backend-test 3010; do sleep 2; done' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Database and API ready, initializing..."' >> /usr/src/app/start-tests.sh && \
    echo 'cd /usr/src/app/Test && node db-setup.js init' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Running tests..."' >> /usr/src/app/start-tests.sh && \
    echo 'cd /usr/src/app/Test/Backend-Integrativi && npm test' >> /usr/src/app/start-tests.sh && \
    echo 'echo "Tests completed"' >> /usr/src/app/start-tests.sh && \
    chmod +x /usr/src/app/start-tests.sh

WORKDIR /usr/src/app/Test/Backend-Integrativi

CMD ["sh", "/usr/src/app/start-tests.sh"] 