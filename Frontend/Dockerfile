# Usa l'immagine ufficiale di Nginx
FROM nginx:alpine

# Copia tutti i file del frontend nella cartella di default di Nginx
COPY . /usr/share/nginx/html

# Crea la directory Media se non esiste
RUN mkdir -p /usr/share/nginx/html/Media

# Configura Nginx per gestire il routing SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    # Gestione delle API che vengono passate al backend \
    location /api { \
        proxy_pass http://backend:3005; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
    # Configurazione per il routing SPA \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Espone la porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 