# Usa un'immagine Nginx super leggera e sicura
FROM nginx:1.25-alpine

# Copia la configurazione personalizzata di Nginx che gestisce il routing
# (Assicurati che questo file esista in Frontend/nginx.conf)
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copia TUTTO il contenuto della cartella Frontend (i tuoi file .html, .css, .js, immagini, ecc.)
# nella cartella del server web di Nginx.
COPY Frontend/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]