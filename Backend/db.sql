SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

/*
Tabella: carts
Carrelli associati agli utenti.
- id: Identificativo carrello (PK, AUTO_INCREMENT)
- user_id: FK verso users.id (univoco)
- created_at: Timestamp creazione
- updated_at: Timestamp aggiornamento
Vincoli: PK su id, Unicità su user_id, FK su user_id (cascata su delete)
*/
CREATE TABLE `carts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `carts` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(6, 40, '2025-05-20 14:36:24', '2025-05-20 14:36:24'),
(7, 47, '2025-05-20 14:37:53', '2025-05-20 14:37:53'),
(8, 48, '2025-05-20 14:41:04', '2025-05-20 14:41:04'),
(9, 49, '2025-05-20 14:43:02', '2025-05-20 14:43:02'),
(10, 50, '2025-05-20 14:43:51', '2025-05-20 14:43:51'),
(11, 46, '2025-05-20 14:49:09', '2025-05-20 14:49:09');

/*
Tabella: cart_items
Prodotti nei carrelli.
- id: Identificativo (PK, AUTO_INCREMENT)
- cart_id: FK verso carts.id
- product_id: FK verso products.id
- quantity: Quantità
- added_at: Timestamp aggiunta
Vincoli: PK su id, FK su cart_id (cascata su delete), FK su product_id
*/
CREATE TABLE `cart_items` (
  `id` int NOT NULL,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `added_at`) VALUES
(50, 6, 27, 2, '2025-05-20 14:36:24'),
(51, 6, 21, 3, '2025-05-20 14:36:33'),
(55, 8, 21, 1, '2025-05-20 14:41:33'),
(56, 8, 19, 1, '2025-05-20 14:41:39'),
(58, 9, 24, 2, '2025-05-20 14:43:36'),
(61, 10, 24, 1, '2025-05-20 14:44:22');

/*
Tabella: categories
Categorie dei prodotti (supporta gerarchia tramite dad_id).
- id: Identificativo categoria (PK, AUTO_INCREMENT)
- name: Nome categoria
- description: Descrizione
- dad_id: FK verso categories.id (categoria padre, opzionale)
Vincoli: PK su id, FK su dad_id (restrizione su delete/update)
*/
CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `dad_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `categories` (`id`, `name`, `description`, `dad_id`) VALUES
(1, 'root', NULL, NULL),
(21, 'Lattiero-Caseari', 'Prodotti del latte tipici', 1),
(22, 'Carne e Salumi', 'Tutti i migliori tagli di carne prodotti direttamente dai nostri artigiani', 1),
(23, 'Farine e Cereali', 'Farine artigianali e cereali genuini, macinati a pietra e coltivati con cura', 1),
(24, 'Latte fresco', 'Latte appena munto, genuino e non trattato', 21),
(25, 'Formaggi freschi', 'Sapori freschi, lavorati artigianalmente', 21),
(26, 'Salumi artigianali', 'Gusto vero, senza compromessi', 22),
(27, 'Carne fresca', 'Carne locale, fresca e controllata', 22),
(28, 'Farina', 'Farine naturali, macinate a pietra', 23),
(30, 'Pane artigianale', 'Impastato a mano, cotto come una volta', 23);

/*
Tabella: category_images
Immagini associate alle categorie.
- id: Identificativo (PK, AUTO_INCREMENT)
- category_id: FK verso categories.id
- url: URL immagine
- alt_text: Testo alternativo
Vincoli: PK su id, FK su category_id (cascata su delete/update)
*/
CREATE TABLE `category_images` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `category_images` (`id`, `category_id`, `url`, `alt_text`) VALUES
(5, 21, '/Media/category/21/1747747366483-932214850.webp', 'Immagine category 21'),
(6, 22, '/Media/category/22/1747747421479-286738154.webp', 'Immagine category 22'),
(7, 23, '/Media/category/23/1747747482407-632913711.webp', 'Immagine category 23'),
(8, 24, '/Media/category/24/1747747604678-263108332.webp', 'Immagine category 24'),
(9, 25, '/Media/category/25/1747747657187-826485538.webp', 'Immagine category 25'),
(10, 26, '/Media/category/26/1747747715175-257205941.webp', 'Immagine category 26'),
(11, 27, '/Media/category/27/1747747770857-516081224.webp', 'Immagine category 27'),
(12, 28, '/Media/category/28/1747747830612-654958890.webp', 'Immagine category 28'),
(13, 30, '/Media/category/30/1747747932311-449710407.webp', 'Immagine category 30');

/*
Tabella: delivery_info
Indirizzi di consegna degli utenti.
- id: Identificativo (PK, AUTO_INCREMENT)
- user_id: FK verso users.id
- name: Nome destinatario
- surname: Cognome destinatario
- stato: Stato
- citta: Città
- provincia: Provincia
- via: Via
- cap: CAP
- numero_civico: Numero civico
Vincoli: PK su id, FK su user_id
*/
CREATE TABLE `delivery_info` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `stato` varchar(32) NOT NULL,
  `citta` varchar(32) NOT NULL,
  `provincia` varchar(32) NOT NULL,
  `via` varchar(32) NOT NULL,
  `cap` varchar(32) NOT NULL,
  `numero_civico` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `delivery_info` (`id`, `user_id`, `name`, `surname`, `stato`, `citta`, `provincia`, `via`, `cap`, `numero_civico`) VALUES
(4, 46, 'Antonio', 'Rossi', 'Italia', 'Milano', 'Milano', 'Via Monte Napoleone', '20121', 12),
(5, 47, 'Francesco', 'Bianchi', 'Italia', 'Torino', 'Torino', 'Corso Francia', '10143', 85),
(6, 48, 'Davide', 'Ferrari', 'Italia', 'Firenze', 'Firenze', 'Via dei Neri', '50122', 23),
(7, 49, 'Giovanni', 'Romano', 'Italia', 'Napoli', 'Napoli', 'Via Toledo', '80134', 110),
(8, 50, 'Andrea', 'Greco', 'Italia', 'Palermo', 'Palermo', 'Via Maqueda', '90133', 45);

/*
Tabella: extended_users
Estende le informazioni degli utenti (bio, banner, stato approvazione).
- id_users: FK verso users.id (PK)
- url_banner: URL dell'''immagine banner
- bio: Biografia dell'''utente
- approved: Stato di approvazione (0/1)
- alt_text: Testo alternativo per l''immagine
- approved_at: Data di approvazione
Vincoli: PK su id_users, FK su users.id (cascata su delete/update)
*/
CREATE TABLE `extended_users` (
  `id_users` int NOT NULL,
  `url_banner` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci,
  `bio` varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT '0',
  `alt_text` varchar(255) NOT NULL DEFAULT '....',
  `approved_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `extended_users` (`id_users`, `url_banner`, `bio`, `approved`, `alt_text`, `approved_at`) VALUES
(40, '/Media/banner/40-banner-1747746051928.jpg', 'Sin da giovane ha coltivato l amore per la vita agricola, trasformandolo in una professione fatta di impegno quotidiano, rispetto per gli animali e attenzione alla qualita. Nella sua azienda agricola, Alessandro si dedica con cura all allevamento bovino, seguendo metodi sostenibili e puntando su un latte sano e genuino. Il suo lavoro riflette l equilibrio tra innovazione e tradizione, con uno sguardo sempre rivolto al futuro dell agricoltura.', 0, '', '2025-05-20 13:00:52'),
(41, '/Media/banner/41-banner-1747745799813.jpg', 'Cresciuto in campagna, ha imparato fin da giovane l arte dell allevamento e oggi gestisce con dedizione una piccola azienda agricola a conduzione familiare. Si prende cura delle sue mucche con attenzione e rispetto, puntando sulla qualita del latte e su pratiche sostenibili. Ogni giorno, Matteo lavora con impegno per garantire prodotti genuini e per mantenere viva la tradizione agricola del suo territorio.', 1, '', '2025-05-20 12:56:40'),
(42, '/Media/banner/42-banner-1747746163986.png', 'Leonardo e un allevatore di maiali che ha fatto della cura e della qualita il cuore del suo lavoro. Cresciuto tra i valori della campagna, ha scelto di dedicarsi all allevamento suino con passione e competenza, seguendo metodi che rispettano il benessere animale e l ambiente. Nella sua azienda agricola, Leonardo alleva maiali in spazi adeguati e con un alimentazione controllata, garantendo prodotti genuini e di alta qualita. La sua esperienza e il suo impegno si riflettono in ogni fase del processo, dalla stalla alla tavola, unendo tradizione e attenzione alla sostenibilita.', 1, '', '2025-05-20 13:02:45'),
(43, '/Media/banner/43-banner-1747746259230.jpg', 'Lorenzo e un allevatore di maiali con una profonda dedizione per il lavoro agricolo e il rispetto della tradizione. Da anni gestisce con passione la sua azienda, dove si prende cura dei suoi animali con attenzione e serieta. Il suo allevamento si distingue per la cura del benessere suino, l alimentazione naturale e il rispetto dei ritmi della natura. Lorenzo crede nella qualita prima della quantita e lavora ogni giorno per offrire prodotti autentici e sostenibili, frutto di un mestiere che unisce fatica, competenza e amore per la terra.', 1, '', '2025-05-20 13:04:20'),
(44, '/Media/banner/44-banner-1747746390998.jpg', 'Giuseppe e un agricoltore appassionato che dedica la sua vita alla coltivazione della terra con rispetto, esperienza e amore per la natura. Cresciuto tra i campi, ha scelto di portare avanti la tradizione agricola di famiglia, adottando pratiche sostenibili e valorizzando i prodotti del territorio. Nella sua azienda, Giuseppe coltiva con cura ortaggi, cereali e frutta di stagione, puntando sempre sulla qualita, la freschezza e il legame con la terra. Ogni giorno lavora con le mani e con il cuore, mantenendo vivo un mestiere antico ma piu che mai attuale.', 1, '', '2025-05-20 13:06:32'),
(45, '/Media/banner/45-banner-1747746603652.jpg', 'Marco e un agricoltore che ha trasformato la sua passione per la terra in una vera e propria vocazione. Con dedizione e spirito pratico, coltiva i suoi campi seguendo i cicli naturali e adottando tecniche agricole sostenibili. La sua azienda e un esempio di equilibrio tra tradizione e innovazione, dove ogni prodotto racconta una storia di impegno, stagionalita e rispetto per l ambiente. Marco crede nel valore del cibo genuino e nel legame diretto con il territorio, offrendo ogni giorno frutti della terra coltivati con cura e responsabilita.', 0, '', '2025-05-20 13:10:04'),
(61, '/Media/banner/61-banner-1747746754722.jpg', 'Mi chiamo Enrico. Sono agricoltore da tutta la vita, come mio padre e mio nonno prima di me. Lavoro la terra con le mie mani, senza tante macchine o cose moderne. Credo che la terra va rispettata e curata con calma, senza fretta. Non capisco molto di nuove tecniche, ma so quando la terra sta bene e quando no. Per me coltivare e fatica vera, e vivere in mezzo alla natura. Qui, tra i campi, e il posto dove voglio stare fino alla fine.', 1, '', '2025-05-20 13:12:35');
/*
Tabella: issues
Segnalazioni e richieste di assistenza degli utenti.
- id_issue: Identificativo (PK, AUTO_INCREMENT)
- id_client: FK verso users.id
- description: Descrizione del problema
- status: Stato ('open', 'closed'', 'refused'', 'solved'')
- title: Titolo breve
- created_at: Data creazione
- admin_note: Nota dell'''amministratore
Vincoli: PK su id_issue, FK su id_client
*/
CREATE TABLE `issues` (
  `id_issue` int NOT NULL,
  `id_client` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `status` enum('open','closed','refused','solved') NOT NULL,
  `title` varchar(32) NOT NULL,
  `created_at` date NOT NULL,
  `admin_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `issues` (`id_issue`, `id_client`, `description`, `status`, `title`, `created_at`, `admin_note`) VALUES
(64, 2, 'Bottoni disallineati per la login', 'open', 'Problema grafico', '2025-05-20', NULL),
(65, 39, 'Il pagamento con carta viene rifiutato senza motivo.', 'closed', 'Errore pagamento', '2025-05-20', 'Risolto dal supporto tecnico.'),
(66, 40, 'Ho ordinato 3 prodotti ma ne è arrivato solo 1.', 'solved', 'Prodotto mancante', '2025-05-19', 'Prodotto mancante spedito.'),
(67, 41, 'Vorrei ricevere la fattura per l''ordine #1234.', 'refused', 'Richiesta fattura', '2025-05-18', 'Fattura già inviata in precedenza.'),
(68, 42, 'l app si blocca quando apro la sezione offerte.', 'open', 'Bug su mobile', '2025-05-17', NULL),
(69, 43, 'Ho bisogno di cambiare l''indirizzo di spedizione.', 'closed', 'Modifica indirizzo', '2025-05-20', 'Indirizzo aggiornato.'),
(70, 44, 'Il codice sconto non viene accettato.', 'solved', 'Problema coupon', '2025-05-19', 'Coupon riattivato.'),
(71, 45, 'Il prodotto ricevuto è danneggiato.', 'refused', 'Prodotto difettoso', '2025-05-18', 'Richiesta rifiutata: foto non fornita.'),
(72, 46, 'Quando verrà spedito il mio ordine?', 'open', 'Domanda su spedizione', '2025-05-17', NULL),
(73, 47, 'Non riesco a completare la registrazione.', 'closed', 'Errore registrazione', '2025-05-16', 'Registrazione completata manualmente.'),
(74, 48, 'Vorrei restituire un prodotto.', 'solved', 'Richiesta reso', '2025-05-20', 'Reso autorizzato e rimborsato.'),
(75, 49, 'Il mio account è stato bloccato.', 'refused', 'Problema account', '2025-05-19', 'Account bloccato per violazione termini.'),
(76, 50, 'Sarebbe utile avere una wishlist.', 'open', 'Suggerimento', '2025-05-18', NULL),
(77, 51, 'Non riesco a completare l''acquisto.', 'closed', 'Errore checkout', '2025-05-17', 'Problema risolto, riprova ora.'),
(78, 52, 'Vorrei sapere se il prodotto è disponibile in altri colori.', 'solved', 'Richiesta info prodotto', '2025-05-16', 'Disponibile solo in blu e rosso.'),
(79, 53, 'Il tracking non funziona.', 'refused', 'Problema spedizione', '2025-05-20', 'Tracking funzionante, controlla il link.'),
(80, 54, 'Ho ricevuto una fattura errata.', 'open', 'Errore fatturazione', '2025-05-19', NULL),
(81, 55, 'Il prodotto non corrisponde alla descrizione.', 'closed', 'Prodotto non conforme', '2025-05-18', 'Reso accettato e rimborso effettuato.'),
(82, 56, 'Ho bisogno di assistenza per un ordine.', 'solved', 'Richiesta assistenza', '2025-05-17', 'Assistenza fornita telefonicamente.'),
(83, 57, 'Mi esce la che mia pssword è compromessa da google', 'refused', 'Problema login', '2025-05-16', 'Funzionalità non ancora disponibile.');

/*
Tabella: orders
Ordini effettuati dagli utenti.
- id: Identificativo ordine (PK, AUTO_INCREMENT)
- client_id: FK verso users.id
- total_price: Prezzo totale
- status: Stato ordine ('pending', 'accepted'', 'delivered'', 'shipped'', 'refused'')
- created_at: Timestamp creazione
Vincoli: PK su id, FK su client_id
*/
CREATE TABLE `orders` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `orders` (`id`, `client_id`, `total_price`, `status`, `created_at`) VALUES
(22, 47, 54.00, 'accepted', '2025-05-20 14:38:39'),
(23, 48, 52.00, 'delivered', '2025-05-20 14:41:26'),
(24, 49, 12.00, 'shipped', '2025-05-20 14:43:19'),
(25, 50, 7.00, 'refused', '2025-05-20 14:44:15'),
(26, 46, 20.00, 'pending', '2025-05-20 14:49:23');

/*
Tabella: order_items
Prodotti negli ordini.
- id: Identificativo (PK, AUTO_INCREMENT)
- order_id: FK verso orders.id
- product_id: FK verso products.id
- quantity: Quantità
- unit_price: Prezzo unitario
Vincoli: PK su id, FK su order_id (cascata su delete), FK su product_id
*/
CREATE TABLE `order_items` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES
(20, 22, 19, 4, 10.00),
(21, 22, 23, 7, 2.00),
(22, 23, 16, 13, 4.00),
(23, 24, 22, 10, 1.20),
(24, 25, 15, 1, 3.00),
(25, 25, 16, 1, 4.00),
(26, 26, 20, 1, 20.00);

/*
Tabella: products
Prodotti in vendita.
- id: Identificativo prodotto (PK, AUTO_INCREMENT)
- artisan_id: FK verso users.id (artigiano proprietario)
- name: Nome prodotto
- description: Descrizione
- price: Prezzo
- discount: Sconto (percentuale)
- stock: Quantità disponibile
- category_id: FK verso categories.id
- created_at: Timestamp creazione
Vincoli: PK su id, FK su artisan_id (cascata su delete), FK su category_id
*/
CREATE TABLE `products` (
  `id` int NOT NULL,
  `artisan_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `discount` int NOT NULL DEFAULT '0',
  `stock` int NOT NULL DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `products` (`id`, `artisan_id`, `name`, `description`, `price`, `discount`, `stock`, `category_id`, `created_at`) VALUES
(15, 41, 'Latte intero', 'Latte intero, ricco e naturale.', 3.00, 0, 100, 24, '2025-05-20 13:45:04'),
(16, 41, 'Latte scremato', 'Latte scremato, leggero e naturale.', 4.00, 0, 187, 24, '2025-05-20 13:48:22'),
(17, 42, 'Prosciutto crudo', 'Prosciutto crudo stagionato artigianalmente, dal sapore delicato e inconfondibile. Realizzato con carni selezionate e lavorato secondo tradizione, offre una consistenza morbida e un aroma intenso che racconta la cura e la pazienza di un mestiere antico. Perfetto per chi cerca qualita e gusto autentico direttamente dal produttore.', 65.00, 0, 50, 26, '2025-05-20 13:50:51'),
(19, 42, 'Coppa', 'Coppa artigianale, preparata con carni scelte e stagionata lentamente per esaltare il suo sapore ricco e aromatico. Ogni fetta racconta la tradizione e l attenzione alla qualita, offrendo un prodotto dal gusto intenso e dalla consistenza morbida, ideale per chi ama i salumi genuini fatti con passione.', 10.00, 0, 26, 26, '2025-05-20 13:52:12'),
(20, 43, 'Costine', 'Costine fresche di alta qualita, provenienti da allevamenti selezionati e lavorate con cura per garantire un sapore ricco e autentico. Perfette per essere grigliate o cucinate lentamente, offrono una carne tenera e succosa, ideale per chi ama i sapori decisi e genuini della tradizione.', 20.00, 0, 100, 27, '2025-05-20 13:56:40'),
(21, 43, 'Tagliata', 'Tagliata di carne di prima scelta, tenera e succosa, ideale per una preparazione veloce che esalta il gusto naturale della carne. Tagliata a fette sottili dopo una breve cottura, conserva tutta la morbidezza e l aroma tipico della carne fresca allevata con cura. Perfetta per chi ama i sapori intensi e genuini.', 15.00, 0, 0, 27, '2025-05-20 13:58:05'),
(22, 44, 'Tartarughe', 'Pane Tartarughe, prodotto artigianale caratterizzato dalla sua forma unica e dal gusto rustico. Realizzato con farine selezionate e lievito naturale, e fragrante fuori e morbido dentro, perfetto per accompagnare ogni pasto o per uno spuntino genuino. Un pane che unisce tradizione e originalita, ideale per chi cerca sapori autentici e qualita artigianale.', 1.20, 0, 490, 30, '2025-05-20 14:02:13'),
(23, 44, 'Filone di pane', 'Filone di pane artigianale, fragrante e dalla crosta croccante, realizzato con farine selezionate e lievitazione naturale. Morbido all interno e ricco di sapore, e perfetto per ogni occasione, dal pranzo alla cena, accompagnando formaggi, salumi o semplicemente un filo d olio. Un prodotto tradizionale che porta sulla tavola la genuinita del pane fatto come una volta.', 2.00, 0, 493, 30, '2025-05-20 14:03:32'),
(24, 61, 'Ricotta', 'Ricotta fresca e morbida, ottenuta dalla lavorazione del siero del latte secondo metodi tradizionali. Dal sapore delicato e leggermente dolce, e perfetta sia da gustare da sola sia come ingrediente per piatti dolci e salati. Un formaggio versatile che porta freschezza e genuinita direttamente dalla fattoria alla tua tavola.', 3.00, 0, 2, 25, '2025-05-20 14:06:23'),
(25, 61, 'Robiola', 'Robiola fresca e cremosa, prodotta artigianalmente con latte di alta qualita. Dal sapore delicato e leggermente acidulo, e ideale da gustare da sola, spalmata sul pane, o come ingrediente per arricchire ricette tradizionali. Un formaggio versatile che unisce bonta e genuinita, frutto di una lavorazione attenta e rispettosa della tradizione.', 1.90, 0, 1, 25, '2025-05-20 14:07:23'),
(26, 61, 'Farina d''avena', 'Farina d avena naturale, macinata finemente per preservarne tutte le proprieta nutritive. Ideale per preparazioni dolci e salate, e una scelta sana e genuina per chi cerca un alternativa ricca di fibre e dal sapore delicato. Perfetta per chi vuole portare in tavola prodotti semplici, ma ricchi di gusto e benessere.', 3.00, 0, 0, 28, '2025-05-20 14:08:34'),
(27, 61, 'Farina 00', 'Farina 00 raffinata, ideale per tutte le preparazioni di cucina e pasticceria. Dal colore chiaro e dalla consistenza fine, garantisce impasti leggeri e soffici, perfetti per pane, dolci, pasta fresca e pizza. Un prodotto versatile e di qualita, scelto da chi ama lavorare con materie prime controllate e affidabili.', 0.70, 0, 3, 28, '2025-05-20 14:09:52');
/*
Tabella: product_images
Immagini dei prodotti.
- id: Identificativo (PK, AUTO_INCREMENT)
- product_id: FK verso products.id
- url: URL immagine
- alt_text: Testo alternativo
Vincoli: PK su id, FK su product_id (cascata su delete)
*/

CREATE TABLE `product_images` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `url` text NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `product_images` (`id`, `product_id`, `url`, `alt_text`) VALUES
(26, 15, '/Media/product/15/1747748703920-804360163.webp', 'Immagine product 15'),
(27, 15, '/Media/product/15/1747748704196-976358089.webp', 'Immagine product 15'),
(28, 16, '/Media/product/16/1747748901524-626189301.webp', 'Immagine product 16'),
(29, 16, '/Media/product/16/1747748901794-718752012.webp', 'Immagine product 16'),
(30, 17, '/Media/product/17/1747749050163-534022995.webp', 'Immagine product 17'),
(31, 17, '/Media/product/17/1747749050510-170666826.webp', 'Immagine product 17'),
(32, 19, '/Media/product/19/1747749131887-537898203.webp', 'Immagine product 19'),
(33, 19, '/Media/product/19/1747749132176-23999052.webp', 'Immagine product 19'),
(34, 20, '/Media/product/20/1747749399367-716356423.webp', 'Immagine product 20'),
(35, 20, '/Media/product/20/1747749399719-929952189.webp', 'Immagine product 20'),
(36, 21, '/Media/product/21/1747749485027-620450709.webp', 'Immagine product 21'),
(37, 21, '/Media/product/21/1747749485483-588413227.webp', 'Immagine product 21'),
(38, 22, '/Media/product/22/1747749732232-860129932.webp', 'Immagine product 22'),
(39, 22, '/Media/product/22/1747749732701-640870563.webp', 'Immagine product 22'),
(40, 23, '/Media/product/23/1747749811616-243822965.webp', 'Immagine product 23'),
(41, 23, '/Media/product/23/1747749812022-213172993.webp', 'Immagine product 23'),
(42, 24, '/Media/product/24/1747749982444-706453053.webp', 'Immagine product 24'),
(43, 24, '/Media/product/24/1747749982642-294194673.webp', 'Immagine product 24'),
(44, 25, '/Media/product/25/1747750042852-610554384.webp', 'Immagine product 25'),
(45, 25, '/Media/product/25/1747750043118-156056755.webp', 'Immagine product 25'),
(46, 26, '/Media/product/26/1747750113392-999882611.webp', 'Immagine product 26'),
(47, 26, '/Media/product/26/1747750113674-286400147.webp', 'Immagine product 26'),
(48, 27, '/Media/product/27/1747750191390-10694826.webp', 'Immagine product 27'),
(49, 27, '/Media/product/27/1747750191723-671572790.webp', 'Immagine product 27');

/*
Tabella: profile_image
Immagini profilo degli utenti.
- id: Identificativo univoco (PK, AUTO_INCREMENT)
- user_id: FK verso users.id
- url: URL dell'''immagine
- alt_text: Testo alternativo
Vincoli: PK su id, FK su users.id (cascata su delete/update)
*/

CREATE TABLE `profile_image` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `profile_image` (`id`, `user_id`, `url`, `alt_text`) VALUES
(16, 41, '/Media/profile/41/41-profile-1747745799788.jpg', NULL),
(17, 40, '/Media/profile/40/40-profile-1747746051902.jpeg', NULL),
(18, 42, '/Media/profile/42/42-profile-1747746163961.jpg', NULL),
(19, 43, '/Media/profile/43/43-profile-1747746259204.jpg', NULL),
(20, 44, '/Media/profile/44/44-profile-1747746390970.jpg', NULL),
(21, 45, '/Media/profile/45/45-profile-1747746603625.jpg', NULL),
(22, 61, '/Media/profile/61/61-profile-1747746754696.jpg', NULL);

/*
Tabella: users
Contiene le informazioni di base degli utenti (clienti, artigiani, admin).
- id: Identificativo univoco dell'''utente (PK, AUTO_INCREMENT)
- email: Email univoca dell'''utente
- password_hash: Hash della password
- name: Nome dell'''utente
- role: Ruolo dell'''utente ('artisan', 'client', 'admin')
- created_at: Timestamp di creazione
Vincoli: PK su id, Unicità su email
Relazioni: Referenziata da molte altre tabelle tramite FK
*/
CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('artisan','client','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `created_at`) VALUES
(2, 'luca@gmail.com', '$2b$10$Cxuy0GYonAYRwWW/qZKtMei7Ium.PCsKud1jSwQXLxq8ZK8vhtgAO', 'luca', 'admin', '2025-04-16 08:17:19'),
(39, 'mario@gmail.com', '$2b$10$U96H3BybouEaEDhPtc8fHu9EFG5rfDbgeddoqyMxR.Y9EyATUx9Cu', 'Mario', 'client', '2025-05-20 12:37:54'),
(40, 'alessandro@example.com', '$2b$10$D.s5Y7Q4IlpiUW6K1uDokePzSQtQGuwQwollh4VlAK1W0FjO1I7we', 'Alessandro', 'client', '2025-05-20 12:39:06'),
(41, 'matteo@example.com', '$2b$10$tQJis29NJNCPr4gyIIOCh.2t693Bq4.vaV8kQe6lLkcQcH0QZst8e', 'matteo', 'artisan', '2025-05-20 12:39:13'),
(42, 'leonardo@example.com', '$2b$10$Ro30chZCLWHVPwEk2tzVuuIlPskxg/NKA1wt0stFvgAF9Cxhd.jlG', 'leonardo', 'artisan', '2025-05-20 12:39:18'),
(43, 'lorenzo@example.com', '$2b$10$ZNhHqbNtY5rb28bUbi0y/eKRMPRcN6Y39jdQjqGl1qmL4DURA376G', 'lorenzo', 'artisan', '2025-05-20 12:39:24'),
(44, 'giuseppe@example.com', '$2b$10$e8xOC9LI54wcFozJIW8.z.ZKDNXb94YCrm2xCNiVhHB7BccsQ3GDC', 'giuseppe', 'artisan', '2025-05-20 12:39:32'),
(45, 'marco@example.com', '$2b$10$ioM6gmOOiJ25RwVxBAYss.Ruqpmi.Z/h8xYj6ea8DXU.m7hkrwCAu', 'marco', 'client', '2025-05-20 12:39:40'),
(46, 'antonio@example.com', '$2b$10$E9KMKz0e8IAyROSas7ka5ub83UgNfJAef6kOgPPmT9AxqQezGyANu', 'Antonio', 'client', '2025-05-20 12:39:47'),
(47, 'francesco@example.com', '$2b$10$Vw5PlqMgjtA5ZfpGq3jZpOSmMgjZTK4SS/Ns7SgOzg/yjVbu2gKEy', 'Francesco', 'client', '2025-05-20 12:39:55'),
(48, 'davide@example.com', '$2b$10$mBU38is0qTQ3KvhEGp2saeFiZ/osOI2l6VX70S4kTWX.wYdub2XsC', 'Davide', 'client', '2025-05-20 12:40:00'),
(49, 'giovanni@example.com', '$2b$10$cpBQk9D3xyeKyKhKs4w.aeUjLcKtNMOyU0yRkZmsuNiTL02WqXdXq', 'Giovanni', 'client', '2025-05-20 12:40:05'),
(50, 'andrea@example.com', '$2b$10$n/ztjFPO0rjaYTQhPiWEI.oXwaCybJZPC/tmwyQVndFFgsCoLpi/S', 'Andrea', 'client', '2025-05-20 12:40:25'),
(51, 'federico@example.com', '$2b$10$1BwPpP4KhKxHeoLSc85aZ.ZbO4C3gIenp4GghdORsF97RgLbcj0gW', 'federico', 'client', '2025-05-20 12:40:31'),
(52, 'tommaso@example.com', '$2b$10$hMGScE1b2g4HXV6463sTuuPH62WPah7p1vgTz.8UM0sVhga8DS2BG', 'tommaso', 'client', '2025-05-20 12:40:37'),
(53, 'pietro@example.com', '$2b$10$lV1ljm4oSRlD1HhYvYMi5.dQwOJ9rTIrqlZ3AwHqJd5gZCCstRoXi', 'pietro', 'client', '2025-05-20 12:40:42'),
(54, 'simone@example.com', '$2b$10$7X4jqWwdGo0SKTxYfu/ID.pcngcoHJC8G3UjTgOrfl28n23uCbBSq', 'simone', 'client', '2025-05-20 12:40:47'),
(55, 'michele@example.com', '$2b$10$0ZJd5Kp9.AT37xWKA09bau3FfFtJjZpx2WYhkIueYOEI1ISkZROsu', 'michele', 'client', '2025-05-20 12:40:51'),
(56, 'riccardo@example.com', '$2b$10$cz6QZ03tNBkGw20RUnU9veov197bt3G5SJyf2AMQlnWR8mFaZsKby', 'riccardo', 'admin', '2025-05-20 12:41:02'),
(57, 'emanuele@example.com', '$2b$10$FymTyRI37hdS.KchNxJftelA/l3fFoBmjmaRfrNsbEtefaDXazQHq', 'emanuele', 'client', '2025-05-20 12:41:10'),
(58, 'gabriele@example.com', '$2b$10$zKVbUM5IRVvNuC1IKCFBZui/lEBzTagfT8.RyfBc3HePX/K4B8C.2', 'gabriele', 'client', '2025-05-20 12:41:15'),
(59, 'samuele@example.com', '$2b$10$PIBG.HdRfrXXT4T1e02hn.m3xbgGdVDaildQi/ptonjxv/VJvgWXy', 'samuele', 'client', '2025-05-20 12:45:18'),
(60, 'diego@example.com', '$2b$10$bKPhz9h92zLbAB3CwSgrxe6BNkNWNVkBB1RQt81bPMA1nO.aOB5y6', 'diego', 'client', '2025-05-20 12:45:24'),
(61, 'enrico@example.com', '$2b$10$rVfuC/ZqCZuyLf4JnWABwuY3uo/nDzQr9zeaAMvrLoP5PlLBYikQm', 'enrico', 'artisan', '2025-05-20 12:45:29'),
(62, 'elia@example.com', '$2b$10$Xha7BSIA4ipVaCbapKWb/eyeqgxRtNNqzdmNYfYrRzZccsuqDg8tS', 'elia', 'client', '2025-05-20 12:45:35'),
(63, 'valerio@example.com', '$2b$10$vC5L9CWNOp59DXnbghBBOOG8iwE8PvbyGUkOUNH2LaJz/X8ZMQGJ2', 'valerio', 'client', '2025-05-20 12:45:41'),
(64, 'massimo@example.com', '$2b$10$4FERj8D2KX/AcLsMTSjDU./658/QPMohZmvZfqcPkpJPLMcfh3nBK', 'massimo', 'client', '2025-05-20 12:45:53'),
(65, 'fabrizio@example.com', '$2b$10$Bms7/Ls1KmD9g/cDW0LDzubeXbAFRj3FsPV79gHV5aAXMtoDzg4SK', 'fabrizio', 'client', '2025-05-20 12:45:58'),
(66, 'pippo@gmail.com', '$2b$10$SkjD16CM9viExmbwOqEfVuU2OW/K/.rRRbYB28kqdlOWeS0o2L9xu', 'pippo', 'client', '2025-05-20 12:51:22');


ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `product_id` (`product_id`);

ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appartiene` (`dad_id`);

ALTER TABLE `category_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `a` (`category_id`);

ALTER TABLE `delivery_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `useraddress` (`user_id`);

ALTER TABLE `extended_users`
  ADD PRIMARY KEY (`id_users`);

ALTER TABLE `issues`
  ADD PRIMARY KEY (`id_issue`),
  ADD KEY `cid_issue` (`id_client`);

ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `artisan_id` (`artisan_id`),
  ADD KEY `category_id` (`category_id`);

ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

ALTER TABLE `profile_image`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aa` (`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);


ALTER TABLE `carts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

ALTER TABLE `cart_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

ALTER TABLE `category_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

ALTER TABLE `delivery_info`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

ALTER TABLE `issues`
  MODIFY `id_issue` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

ALTER TABLE `product_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

ALTER TABLE `profile_image`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;


ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `categories`
  ADD CONSTRAINT `appartiene` FOREIGN KEY (`dad_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `category_images`
  ADD CONSTRAINT `a` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `delivery_info`
  ADD CONSTRAINT `useraddress` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `extended_users`
  ADD CONSTRAINT `aaa` FOREIGN KEY (`id_users`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `issues`
  ADD CONSTRAINT `cid_issue` FOREIGN KEY (`id_client`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`artisan_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `profile_image`
  ADD CONSTRAINT `aa` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

