-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 31 Agu 2024 pada 12.06
-- Versi server: 10.6.18-MariaDB-cll-lve
-- Versi PHP: 8.3.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `keviniom_financial_management`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `expenses`
--

INSERT INTO `expenses` (`id`, `amount`, `date`, `description`, `category`, `user_id`) VALUES
(6, 23600.00, '2024-08-16', 'makanan', 'Makanan', NULL),
(7, 51000.00, '2024-08-16', 'makanan', 'Makanan', NULL),
(8, 15000.00, '2024-08-16', 'makanan', 'Makanan', NULL),
(9, 111239.00, '2024-08-18', 'Wifi', 'Lainnya', NULL),
(10, 16000.00, '2024-08-18', 'Makanan', 'Makanan', NULL),
(11, 21500.00, '2024-08-18', 'Makanan', 'Makanan', NULL),
(12, 14000.00, '2024-08-19', 'Makanan', 'Makanan', NULL),
(13, 10000.00, '2024-08-19', 'Makanan', 'Makanan', NULL),
(14, 10900.00, '2024-08-19', 'Makanan', 'Makanan', NULL),
(15, 16000.00, '2024-08-21', 'Makanan', 'Makanan', NULL),
(16, 12000.00, '2024-08-21', 'Makanan', 'Makanan', NULL),
(17, 131500.00, '2024-08-22', 'Makanan', 'Makanan', NULL),
(18, 15000.00, '2024-08-23', 'Makanan', 'Makanan', NULL),
(19, 15000.00, '2024-08-23', 'Makanan', 'Makanan', NULL),
(20, 26000.00, '2024-08-24', 'Makanan', 'Makanan', NULL),
(21, 99610.00, '2024-08-25', 'Makanan', 'Makanan', NULL),
(22, 23500.00, '2024-08-25', 'Makanan', 'Makanan', NULL),
(23, 13209.00, '2024-08-26', 'Makanan', 'Makanan', NULL),
(24, 3000.00, '2024-08-26', 'Makanan', 'Makanan', NULL),
(25, 44000.00, '2024-08-26', 'Makanan', 'Makanan', NULL),
(26, 15000.00, '2024-08-28', 'Makanan', 'Makanan', NULL),
(27, 21500.00, '2024-08-28', 'Makanan', 'Makanan', NULL),
(28, 12000.00, '2024-08-28', 'Makanan', 'Makanan', NULL),
(29, 28000.00, '2024-08-28', 'Makanan', 'Makanan', NULL),
(30, 10000.00, '2024-08-29', 'Lainnya', 'Lainnya', NULL),
(31, 3285.00, '2024-08-29', 'Makanan', 'Makanan', NULL),
(32, 10000.00, '2024-08-29', 'Makanan', 'Makanan', NULL),
(33, 10000.00, '2024-08-29', 'tes', 'tes', NULL),
(34, 1000.00, '2024-08-29', 'tes', 'tes', NULL),
(35, 1000.00, '2024-08-29', 'tes', 'tes', 6),
(36, 771843.00, '2024-08-29', 'Makanan', 'Makanan', 3),
(37, 10000.00, '2024-08-29', 'tes', 'tes', 7),
(38, 20000.00, '2024-08-30', 'makan kantin fisipol', 'Makanan', 3),
(39, 12000.00, '2024-08-30', 'jus stroberi', 'Minuman', 3);

-- --------------------------------------------------------

--
-- Struktur dari tabel `income`
--

CREATE TABLE `income` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `income`
--

INSERT INTO `income` (`id`, `amount`, `date`, `description`, `user_id`) VALUES
(6, 1500000.00, '2024-08-01', 'Uang masuk', NULL),
(7, 100000.00, '2024-08-29', 'tes', 6),
(8, 1500000.00, '2024-08-01', 'Pemasukan', 3),
(9, 25000.00, '2024-08-29', 'tes', 7);

-- --------------------------------------------------------

--
-- Struktur dari tabel `monthly_expenses`
--

CREATE TABLE `monthly_expenses` (
  `id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `monthly_income`
--

CREATE TABLE `monthly_income` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `month` int(11) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `total_income` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `monthly_savings`
--

CREATE TABLE `monthly_savings` (
  `id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `savings`
--

CREATE TABLE `savings` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `savings`
--

INSERT INTO `savings` (`id`, `amount`, `date`, `description`, `user_id`) VALUES
(21, 200000.00, '2024-08-29', 'Tabungan', NULL),
(24, 50000.00, '2024-08-29', 'tes', NULL),
(25, 10000.00, '2024-08-29', 'tes', 6),
(26, 200000.00, '2024-08-29', 'Tabungan', 3),
(27, 5000.00, '2024-08-29', 'tes', 7);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`) VALUES
(3, 'user', '$2b$10$bligYZI8YR1OC3gv4EKJ4eCncBQkoQs9InHDw4YLDLQaoTfw8M6Du'),
(5, 'user1', '$2b$10$iWdiIcVA9Okpt/8qDhE.zeOI1F/MhmY5ALQbgQ5ZwH1nQG1p60DAa'),
(6, 'tes', '$2b$10$bKYCt9axJrnOmfFVIfppzuua4M1jBawp46fho8voruenfK3JZewUy'),
(7, 'xColth', '$2b$10$3EIafnx/HGFdtnjPuOBE9O5LjZfqh3.R.eO.WvChKZWMkV38f3yEO'),
(8, 'jaw', '$2b$10$eU/KQIuvS/WRBACbBej2hOlxUKiF6sHBhvwkfG5id5Zn7N6adEeHW');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `income`
--
ALTER TABLE `income`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `monthly_expenses`
--
ALTER TABLE `monthly_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `month` (`month`,`year`);

--
-- Indeks untuk tabel `monthly_income`
--
ALTER TABLE `monthly_income`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `monthly_savings`
--
ALTER TABLE `monthly_savings`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `savings`
--
ALTER TABLE `savings`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT untuk tabel `income`
--
ALTER TABLE `income`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `monthly_expenses`
--
ALTER TABLE `monthly_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `monthly_income`
--
ALTER TABLE `monthly_income`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `monthly_savings`
--
ALTER TABLE `monthly_savings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `savings`
--
ALTER TABLE `savings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `monthly_income`
--
ALTER TABLE `monthly_income`
  ADD CONSTRAINT `monthly_income_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
