/*
  config.js
  -----------------------------
  Questo modulo centralizza la configurazione dell'URL base delle API per il frontend di ArtigianatoShop.
  - Permette di cambiare facilmente l'endpoint delle API (es. tra ambiente locale e produzione) modificando una sola variabile.
  - La funzione getApiUrl() garantisce che tutti i servizi e moduli del frontend utilizzino un unico punto di riferimento per l'URL delle API, evitando errori e duplicazioni.
  - Scelta tecnica: separazione della configurazione dal resto della logica applicativa per facilitare manutenzione e deploy.
*/

// Frontend/config.js
// const API_URL = "http://101.58.39.17:3015";
// Frontend/config.js
const API_URL = "http://localhost:3016";

// Frontend/api/config.js


export function getApiUrl() {
    return API_URL;
}