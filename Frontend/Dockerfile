# 1. Parti da un server web Nginx, leggero e veloce
FROM nginx:1.25-alpine

# 2. Copia tutti i tuoi file (HTML, CSS, JS, immagini) 
#    dalla cartella Frontend/ nella cartella del server web del container
COPY Frontend/ /usr/share/nginx/html

# 3. Informa Docker che il container usa la porta 80
EXPOSE 80

# 4. Avvia il server Nginx
CMD ["nginx", "-g", "daemon off;"]