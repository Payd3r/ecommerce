FROM node:20-alpine

WORKDIR /usr/src/app

# Copia i file package per l'installazione delle dipendenze
COPY ./Test/Performance/package*.json ./Test/Performance/

# Installa dipendenze performance tests (incluse devDependencies)
WORKDIR /usr/src/app/Test/Performance
RUN npm install --include=dev

# Copia i file di test e configurazione
COPY ./Test/Performance/ ./

# Installa mysql2 per db-setup nella directory Test
WORKDIR /usr/src/app/Test
RUN npm init -y && npm install mysql2

# Crea cartella output con permessi
RUN mkdir -p /usr/src/app/Test/Output && chmod -R 777 /usr/src/app/Test/Output

# Installa netcat per health checks
RUN apk add --no-cache netcat-openbsd

# Crea script di avvio per performance tests
RUN echo '#!/bin/sh' > /usr/src/app/start-performance.sh && \
    echo 'echo "Starting performance tests..."' >> /usr/src/app/start-performance.sh && \
    echo 'echo "Waiting for backend API..."' >> /usr/src/app/start-performance.sh && \
    echo 'until nc -z backend-test 3001; do sleep 2; done' >> /usr/src/app/start-performance.sh && \
    echo 'echo "Backend API ready"' >> /usr/src/app/start-performance.sh && \
    echo 'sleep 5' >> /usr/src/app/start-performance.sh && \
    echo 'echo "Running performance tests..."' >> /usr/src/app/start-performance.sh && \
    echo 'cd /usr/src/app/Test/Performance' >> /usr/src/app/start-performance.sh && \
    echo 'npx jest --json --outputFile=.jest-results.json || true' >> /usr/src/app/start-performance.sh && \
    echo 'echo "Jest completed, running report generator..."' >> /usr/src/app/start-performance.sh && \
    echo 'node generate-test-report.js' >> /usr/src/app/start-performance.sh && \
    echo 'echo "Performance tests completed"' >> /usr/src/app/start-performance.sh && \
    chmod +x /usr/src/app/start-performance.sh

# Performance tuning per Node.js
ENV NODE_OPTIONS="--max-old-space-size=512 --no-deprecation"

WORKDIR /usr/src/app/Test/Performance

CMD ["/usr/src/app/start-performance.sh"] 