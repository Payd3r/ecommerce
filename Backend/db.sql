-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: bhhcfb8lkdjzm7yexzpq-mysql.services.clever-cloud.com:3306
-- Creato il: Mag 14, 2025 alle 10:20
-- Versione del server: 8.0.22-13
-- Versione PHP: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bhhcfb8lkdjzm7yexzpq`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `carts`
--

CREATE TABLE `carts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-04-18 15:03:24', '2025-04-18 15:03:24'),
(2, 3, '2025-05-05 13:02:31', '2025-05-05 13:02:31'),
(3, 2, '2025-05-05 15:28:19', '2025-05-05 15:28:19'),
(4, 6, '2025-05-07 08:59:00', '2025-05-07 08:59:00'),
(5, 15, '2025-05-07 16:24:32', '2025-05-07 16:24:32');

-- --------------------------------------------------------

--
-- Struttura della tabella `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int NOT NULL,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `added_at`) VALUES
(3, 2, 1, 1, '2025-05-05 13:02:31'),
(41, 1, 8, 1, '2025-05-10 17:17:43');

-- --------------------------------------------------------

--
-- Struttura della tabella `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `dad_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `dad_id`) VALUES
(1, 'root', NULL, NULL),
(2, 'Uomo', '', 1),
(3, 'Donna', 'adnrea picio', 1),
(14, 'Pantaloni', '', 19),
(15, 'Bandalogne', '', 3),
(16, 'Maglie', '', 3),
(17, 'Maglie', '', 2),
(18, 'Felpe', '', 2),
(19, 'Felpe', '', 3);

-- --------------------------------------------------------

--
-- Struttura della tabella `category_images`
--

CREATE TABLE `category_images` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `category_images`
--

INSERT INTO `category_images` (`id`, `category_id`, `url`, `alt_text`) VALUES
(4, 3, '/Media/category/3/1746470792853-7820723.webp', 'Immagine category 3');

-- --------------------------------------------------------

--
-- Struttura della tabella `issues`
--

CREATE TABLE `issues` (
  `id_issue` int NOT NULL,
  `id_client` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `status` enum('open','closed','refused','solved') NOT NULL,
  `title` varchar(32) NOT NULL,
  `created_at` date NOT NULL,
  `admin_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `issues`
--

INSERT INTO `issues` (`id_issue`, `id_client`, `description`, `status`, `title`, `created_at`, `admin_note`) VALUES
(1, 3, 'non va una sega', 'refused', 'non va', '2025-05-01', NULL),
(2, 7, 'non mi piace il sito', 'open', 'brutto', '2025-05-07', NULL),
(33, 1, 'Non riesco ad accedere al mio account', 'open', 'Problema login', '2025-05-01', NULL),
(34, 2, 'Transazione rifiutata senza motivo', 'closed', 'Errore pagamento', '2025-05-02', NULL),
(35, 3, 'Manca un prodotto nell\'ordine', 'closed', 'Prodotto mancante', '2025-05-03', NULL),
(36, 1, 'La pagina si blocca dopo il login', 'open', 'Bug sito', '2025-05-04', NULL),
(37, 2, 'Vorrei un rimborso per ordine errato', 'closed', 'Richiesta rimborso', '2025-05-05', NULL),
(38, 3, 'Il tracking non funziona', 'open', 'Problema spedizione', '2025-05-06', NULL),
(39, 1, 'Non ricevo l\'email di conferma', 'refused', 'Errore registrazione', '2025-05-07', NULL),
(40, 2, 'Articolo arrivato rotto', 'closed', 'Prodotto difettoso', '2025-05-08', NULL),
(41, 3, 'Ho bisogno di aiuto con un ordine', 'open', 'Assistenza richiesta', '2025-05-09', 'ok va bene'),
(42, 1, 'Il codice sconto non viene accettato', 'solved', 'Problema coupon', '2025-05-11', 'sucare il pisello'),
(43, 15, 'ciao', 'closed', 'ciao', '2025-05-11', NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `orders`
--

INSERT INTO `orders` (`id`, `client_id`, `total_price`, `status`, `created_at`) VALUES
(11, 2, 999.90, 'delivered', '2025-05-07 14:15:09'),
(12, 15, 99.99, 'refused', '2025-05-07 16:24:43'),
(13, 2, 29.99, 'accepted', '2025-04-09 18:01:39'),
(14, 15, 59.98, 'accepted', '2025-03-12 18:56:00'),
(15, 15, 12.00, 'delivered', '2025-05-14 09:15:13');

-- --------------------------------------------------------

--
-- Struttura della tabella `order_items`
--

CREATE TABLE `order_items` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES
(8, 11, 1, 10, 99.99),
(9, 12, 1, 1, 99.99),
(10, 13, 13, 1, 29.99),
(11, 14, 13, 2, 29.99),
(12, 15, 8, 1, 12.00);

-- --------------------------------------------------------

--
-- Struttura della tabella `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Struttura della tabella `products`
--

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

--
-- Dump dei dati per la tabella `products`
--

INSERT INTO `products` (`id`, `artisan_id`, `name`, `description`, `price`, `discount`, `stock`, `category_id`, `created_at`) VALUES
(1, 3, 'Vaso in ceramica', 'Vaso fatto a mano in ceramica decorata', 99.99, 0, 11, 19, '2025-04-16 09:59:56'),
(2, 1, 'aaaaaaaaavvvvbbb', '123123123', 12.96, 0, 12, 19, '2025-04-23 19:47:51'),
(3, 1, 'prova', 'prova', 23.00, 0, 25, 14, '2025-04-23 20:21:35'),
(4, 1, 'prova2', 'aaaa', 13.00, 0, 13, 14, '2025-04-23 20:24:58'),
(5, 3, 'prova3', 'aaaaaaaaaaa', 12.00, 0, 0, 2, '2025-05-05 16:18:29'),
(6, 3, 'prova2', 'aaaaaaaaaaa', 12.00, 0, 0, 2, '2025-05-05 16:20:51'),
(7, 3, 'prova1', 'aaaaaaaaaaaaa', 12.00, 0, 0, 15, '2025-05-05 16:22:03'),
(8, 3, 'prova4', 'aaaaaaaaaaaaa', 12.00, 0, 111, 15, '2025-05-05 16:22:15'),
(9, 3, 'Test Product Artisan 1746649859733', 'Un prodotto creato dai test di integrazione artisan', 29.99, 0, 50, 15, '2025-05-07 20:30:59'),
(10, 3, 'Test Product Artisan 1746650002173', 'Un prodotto creato dai test di integrazione artisan', 29.99, 0, 50, 15, '2025-05-07 20:33:22'),
(11, 3, 'Test Product Artisan 1746650032642', 'Un prodotto creato dai test di integrazione artisan', 29.99, 0, 50, 15, '2025-05-07 20:33:52'),
(12, 3, 'Test Product Artisan 1746650046954', 'Un prodotto creato dai test di integrazione artisan', 29.99, 0, 50, 15, '2025-05-07 20:34:06'),
(13, 3, 'Test Product Artisan 1746650266937', 'Un prodotto creato dai test di integrazione artisan', 29.99, 0, 47, 15, '2025-05-07 20:37:46');

-- --------------------------------------------------------

--
-- Struttura della tabella `product_images`
--

CREATE TABLE `product_images` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `url` text NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `url`, `alt_text`) VALUES
(15, 8, '/Media/product/8/1746464237220-417289889.webp', 'Immagine product 8'),
(16, 8, '/Media/product/8/1746464414178-43634602.webp', 'Immagine product 8'),
(17, 8, '/Media/product/8/1746464414532-552765003.webp', 'Immagine product 8'),
(18, 8, '/Media/product/8/1746464414812-3300729.webp', 'Immagine product 8'),
(19, 8, '/Media/product/8/1746464415135-544973496.webp', 'Immagine product 8'),
(20, 8, '/Media/product/8/1746464415517-330982074.webp', 'Immagine product 8'),
(21, 8, '/Media/product/8/1746464415829-825605756.webp', 'Immagine product 8'),
(22, 4, '/Media/product/4/1746641817768-499896574.webp', 'Immagine product 4'),
(23, 4, '/Media/product/4/1746641818176-385896126.webp', 'Immagine product 4'),
(24, 4, '/Media/product/4/1746641818560-879712699.webp', 'Immagine product 4'),
(25, 4, '/Media/product/4/1746641818849-873339100.webp', 'Immagine product 4');

-- --------------------------------------------------------

--
-- Struttura della tabella `profile_image`
--

CREATE TABLE `profile_image` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `profile_image`
--

INSERT INTO `profile_image` (`id`, `user_id`, `url`, `alt_text`) VALUES
(3, 3, '/Media/profile/3/1746463110080-797240617.webp', 'Immagine profile 3'),
(4, 1, '/Media/profile/1/1746467385817-513754040.webp', 'Immagine profile 1');

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('artisan','client','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `created_at`) VALUES
(1, 'andrea@gmail.com', '$2b$10$ZufCuMpuI/3s2sA2LnzgmOnBX/4BVUAfhOhdaXRzAIdLo1ZJnIaUC', 'andrea', 'artisan', '2025-04-15 21:50:25'),
(2, 'luca@gmail.com', '$2b$10$Cxuy0GYonAYRwWW/qZKtMei7Ium.PCsKud1jSwQXLxq8ZK8vhtgAO', 'luca', 'admin', '2025-04-16 08:17:19'),
(3, 'marco@gmail.com', '$2b$10$9r/VATrA93k4uU25Iaej4u54DRdVkqsdi2WUEtPwUBpUoMcjSsPeS', 'marco', 'artisan', '2025-04-16 09:58:02'),
(4, 'paolo@gmail.com', '$2b$10$K9m0I0SX6Q.81Q4mximO1eusBsqJasUgluc0OIUm.FvmWYd.eEug.', 'Paolo', 'artisan', '2025-04-18 10:16:47'),
(6, 'mirko@gmail.com', '$2b$10$fosAGOCrmbEthpj0X4XElO9I.RTXdxCBgzR82IvRE.9LkwdwgwMBW', 'mirko', 'admin', '2025-04-18 17:06:15'),
(7, 'mirkoo@gmail.com', '$2b$10$ApM6KwGbKt5qIKP3eBRPQe2nQA0n64WP9XYP0GfJ4lWvpf8tsdVgi', 'mirkoo', 'admin', '2025-04-18 17:06:47'),
(8, 'mirkooo@gmail.com', '$2b$10$5UtoqYQPYldqrp5nNoXr6ebu0IYnlWe43.x.seKNe2rcrRcontCKy', 'mirkooo', 'admin', '2025-04-18 17:06:51'),
(9, 'mirkoooo@gmail.com', '$2b$10$fUJZ9znh86W3KibFEQcnYuEupBOYJ.vjTnTG.7qixhUOYDFWg4nF2', 'mirko-prof', 'admin', '2025-04-18 17:06:54'),
(11, 'mirkoooooo@gmail.com', '$2b$10$0eri1bmIqMqtNk4HrHLu7eZ5BFNhMFeFAJeN6Sc1jZbkZ4XDnQZDu', 'mirkoooooo', 'admin', '2025-04-18 17:07:02'),
(12, 'mirkooooooo@gmail.com', '$2b$10$9qhXChV1RA5xSRakHAqF6eP8JLpXuQRhJ7FnNzFOmGFDxp.8E9Nyi', 'mirkooooooo', 'admin', '2025-04-18 17:07:06'),
(13, 'andreone@gmail.com', '$2b$10$6Ktl4XGD/4qZSbC149nv4OKeQoBEONHEbEsTb3Rbf/Jbnd7wwrZlO', 'andreone', 'admin', '2025-04-18 17:07:14'),
(15, 'prova@gmail.com', '$2b$10$MgIcCmRhnAwxtTPmsH5QJ.47o3BdsQaut/gwg9vBnYygGCZki6jFG', 'prova', 'client', '2025-04-20 19:28:40'),
(16, 'test1746647789237@example.com', '$2b$10$KwZLofB8ZduoETV0F.UnSe1I0DYSfFT8hTKl5GI4poX6vTKoelXju', 'Integration Test User', 'client', '2025-05-07 19:56:29'),
(17, 'test1746647896875@example.com', '$2b$10$uGAcBamxS0wsmFb/YgkO9OZyvxNHithywlEGmJjhwuqfa6P2JYN4m', 'Integration Test User', 'client', '2025-05-07 19:58:17'),
(18, 'test1746647964178@example.com', '$2b$10$0AqqWySuT3pd4iY6Au92d.QI3TOd2ksiy47B2M5guSgYxnjSiqyia', 'Integration Test User', 'client', '2025-05-07 19:59:24'),
(19, 'test1746648052879@example.com', '$2b$10$rYMguQb4USa0.qwBXa9FR.Q6EsqT7NPXCM4J.GheoPU5ASl1mrEvG', 'Integration Test User', 'client', '2025-05-07 20:00:53'),
(20, 'test1746648105146@example.com', '$2b$10$a1mRcchqsLDVFd9ftKRI4.TP.ASLKyJXyosozXZod/GzmIcaUSQGG', 'Integration Test User', 'client', '2025-05-07 20:01:45'),
(21, 'test1746648213438@example.com', '$2b$10$.HID8eDST0GZVCO2Yohdk.KiZticEoLqa7XcdabiIaTaOpBzyH3Sy', 'Integration Test User', 'client', '2025-05-07 20:03:33'),
(22, 'test1746648432143@example.com', '$2b$10$7JXwFQg5HI4gc/SLhtONCetgctMJxXarsFJHRSftd8y/xrnQT162i', 'Integration Test User', 'client', '2025-05-07 20:07:12'),
(23, 'test1746648473435@example.com', '$2b$10$s6U61afM1YsWB7r.bhV/auOCvLP3C2RglxTotv.d0Uf2KqcSZkknS', 'Integration Test User', 'client', '2025-05-07 20:07:53'),
(24, 'test1746648482430@example.com', '$2b$10$uwKD4RG/l3pGznjqlAax1el5QEfjVi6PBnbQjNTd6jkOdCye3Mv..', 'Integration Test User', 'client', '2025-05-07 20:08:02'),
(25, 'test1746648520167@example.com', '$2b$10$Ei/gAHZRZCQyBES2rwaaVuuBGk9PVGDyDlrbuGerZF.7/s1CNuOm2', 'Integration Test User', 'client', '2025-05-07 20:08:40'),
(26, 'test1746648880501@example.com', '$2b$10$8ykfRH6Q2k.V/yIuCvSirOtmGUQ/77Yl3mC5heljfJFLromFhXf5O', 'Integration Test User', 'client', '2025-05-07 20:14:40'),
(27, 'test1746648927879@example.com', '$2b$10$IQCoCBOxbLG4nqnRR.bRg.6IXD19dfsOZuatDxkHrE46/r1.cw7I6', 'Integration Test User', 'client', '2025-05-07 20:15:28'),
(28, 'test1746649055952@example.com', '$2b$10$pzBKUWD3FlJvAu.p2soIv.SrSiWLCkzN9s6/u1lKpL1aYsIro4yrG', 'Integration Test User', 'client', '2025-05-07 20:17:36'),
(29, 'test1746649212880@example.com', '$2b$10$5ktAfT1BrqvzYzFNchncQOMwmtHS8SZvT3ZlvJwTlvKOZTJzZbJoO', 'Integration Test User', 'client', '2025-05-07 20:20:13'),
(30, 'test1746649471114@example.com', '$2b$10$41TUrkhSe/18RrMdeTw4buL7l9YSBXxt45fm5dTzKBmHoDXVIGD6G', 'Integration Test User', 'client', '2025-05-07 20:24:31'),
(31, 'test1746649523451@example.com', '$2b$10$1S5gcNcl/O4B2Ynxn7Frfuu6dJuAyvRx2bWiwvkaPDktCju0fKJZK', 'Integration Test User', 'client', '2025-05-07 20:25:23'),
(32, 'test1746649858938@example.com', '$2b$10$UVyj/QF7a7J2RU11kSHx/.nxCBnb3IynegxKf94wsYM2oTdjLTgoO', 'Utente Test', 'client', '2025-05-07 20:30:59'),
(33, 'test1746649925164@example.com', '$2b$10$USaZJiIZmUZAyoJjj0MeTuD9siBHv3lgmgTkgKgzScHQwMi4qR4zm', 'Utente Test', 'client', '2025-05-07 20:32:05'),
(34, 'test1746650001824@example.com', '$2b$10$2U9MaDIHmiKSZ486FW9OeudcmvdLjYymIzxNrM/3FY7zG29IJfnJm', 'Utente Test', 'client', '2025-05-07 20:33:22'),
(35, 'test1746650032411@example.com', '$2b$10$s4y4pl0oNThGI2Dh4tfLButY.poD.pBj9eVSbRsP9F0f5j9mWsWei', 'Utente Test', 'client', '2025-05-07 20:33:52'),
(36, 'test1746650046314@example.com', '$2b$10$2PvdVtw3xrOv0dsYd8jxxOq28uDLpxhC4lAB67LYvrEwtN9BSviyq', 'Utente Test', 'client', '2025-05-07 20:34:06'),
(37, 'test1746650266551@example.com', '$2b$10$ixBe5Edxtqqd6k2LtBCnFe5lt3AeuzAx2R4r0y3Ctns4lzessNH7S', 'Utente Test', 'client', '2025-05-07 20:37:46');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indici per le tabelle `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appartiene` (`dad_id`);

--
-- Indici per le tabelle `category_images`
--
ALTER TABLE `category_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `a` (`category_id`);

--
-- Indici per le tabelle `issues`
--
ALTER TABLE `issues`
  ADD PRIMARY KEY (`id_issue`),
  ADD KEY `cid_issue` (`id_client`);

--
-- Indici per le tabelle `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indici per le tabelle `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indici per le tabelle `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indici per le tabelle `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `artisan_id` (`artisan_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indici per le tabelle `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indici per le tabelle `profile_image`
--
ALTER TABLE `profile_image`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aa` (`user_id`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT per la tabella `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT per la tabella `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT per la tabella `category_images`
--
ALTER TABLE `category_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `issues`
--
ALTER TABLE `issues`
  MODIFY `id_issue` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT per la tabella `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT per la tabella `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT per la tabella `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT per la tabella `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT per la tabella `profile_image`
--
ALTER TABLE `profile_image`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Limiti per la tabella `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `appartiene` FOREIGN KEY (`dad_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Limiti per la tabella `category_images`
--
ALTER TABLE `category_images`
  ADD CONSTRAINT `a` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limiti per la tabella `issues`
--
ALTER TABLE `issues`
  ADD CONSTRAINT `cid_issue` FOREIGN KEY (`id_client`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Limiti per la tabella `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`);

--
-- Limiti per la tabella `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Limiti per la tabella `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`artisan_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Limiti per la tabella `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Limiti per la tabella `profile_image`
--
ALTER TABLE `profile_image`
  ADD CONSTRAINT `aa` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
