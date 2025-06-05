FROM node:20-alpine

WORKDIR /usr/src/app

# Copia codice sorgente necessario
COPY ./Test/Performance ./Test/Performance/
COPY ./Test/db-setup.js ./Test/db-setup.js

# Installa dipendenze performance tests
WORKDIR /usr/src/app/Test/Performance
RUN npm install

# Installa mysql2 per db-setup nella root
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
    echo 'until nc -z backend-test 3015; do sleep 2; done' >> /usr/src/app/start-performance.sh && \
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