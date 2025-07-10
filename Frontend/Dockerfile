# ===============================================================
# STAGE 1: Build dell'Applicazione Frontend
# ===============================================================
FROM node:18-slim AS builder

WORKDIR /app

# Copia SOLO i file di package dalla sottocartella Frontend
COPY Frontend/package*.json ./

# Installa le dipendenze in modo pulito e sicuro
RUN npm ci --ignore-scripts

# Copia SOLO il codice sorgente dalla sottocartella Frontend
COPY Frontend/ ./

# Esegui il comando di build che genera i file statici (es. in /app/dist)
RUN npm run build


# ===============================================================
# STAGE 2: Servire i File Statici con Nginx
# ===============================================================
FROM nginx:1.25-alpine

# Rimuovi la configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia la tua configurazione personalizzata
COPY Frontend/nginx.conf /etc/nginx/conf.d/ecommerce.conf

# Copia i file statici costruiti dalla fase precedente
# Assicurati che 'dist' sia il nome corretto della cartella di output della build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]