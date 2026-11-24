-- ========================================================
-- Campus Lost & Found Management System (LaFMS)
-- PostgreSQL / Supabase Schema and Seed Data
-- ========================================================

-- 1. Admins
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

INSERT INTO admins (username, password) VALUES ('admin', '12345');

-- 2. Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (user_id, full_name, student_id, email, department, password, role, created_at) VALUES 
(2,'Sabiha','40','shreyasabiha@gmail.com','CSE','123456','user','2026-07-29 18:15:33'),
(3,'Shreya','101','sabihajahan870@gmail.com','CSE','1234567','user','2026-08-30 20:12:00'),
(4,'Diya','102','diya@gmail.com','CSE','654321','user','2026-08-31 22:03:07'),
(5,'Mim','105','mim@gmail.com','CSE','12345','user','2026-11-16 16:01:29'),
(6,'Sabbosachi','B230201029','sabbosachi@gmail.com','CSE','1122','user','2026-11-22 12:38:41'),
(7,'Skal','123','skal@gmail.com','cse','$2y$10$O.BUjz1Y9YhcqydO28dZ6.VG8AS9I4miz8ViHi.p0j4TJc4IRS9cO','user','2026-11-22 13:10:23');

SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));

-- 3. Found Items
CREATE TABLE found_items (
    found_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    found_date DATE NOT NULL,
    found_location TEXT NOT NULL,
    finder_contact_information TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    item_image TEXT DEFAULT NULL
);

INSERT INTO found_items (found_id, user_id, item_name, category, description, found_date, found_location, finder_contact_information, status, created_at) VALUES
(1,2,'mobile','Electronics','Black Samsung','2026-08-02','Lab','01995438426','Approved','2026-08-02 16:56:49'),
(3,2,'mobile','Electronics','Redmi','2026-08-20','Lab','01995438426','Approved','2026-08-21 16:37:28'),
(5,2,'Calculator','Electronics','Black Color','2026-08-22','CSE Room','01995438426','Approved','2026-08-21 20:06:01'),
(8,2,'mobile','Electronics','Redmi','2026-08-31','CSE Room','01995438426','Returned','2026-08-31 16:47:22'),
(9,3,'Calculator','Electronics','Black','2026-09-01','CSE Room','01995438426','Approved','2026-08-31 20:10:48'),
(10,3,'Laptop','Electronics','Blue','2026-09-01','CSE Room','01995438426','Returned','2026-08-31 20:29:31'),
(11,2,'watch','Electronics','Black','2026-09-02','Lab','01995438426','Returned','2026-08-31 21:11:43'),
(12,4,'Samsung Galaxy A15','Electronics','Black smartphone found with a transparent back cover.','2026-09-03','CSE Class Room','01995438426','Returned','2026-09-01 19:24:58'),
(13,4,'Wallet','Accessories','Caramel color wallet ','2026-09-03','CSE Class Room','01995438426','Returned','2026-09-03 15:38:33'),
(16,3,'Laptop','Electronics','white','2026-09-03','CSE Class Room','01995438426','Approved','2026-09-03 17:20:18'),
(18,4,'watch','Electronics','Black digital watch with black strap','2026-09-05','CSE Class Room','01995438426','Returned','2026-09-03 17:46:48'),
(19,3,'Samsung Galaxy A54','Electronics','Black Samsung Galaxy A54 Phone.','2026-09-24','CSE Building','01995438426','Returned','2026-09-24 16:57:35'),
(20,2,'Wallet','Accessories','black leather wallet','2026-11-16','CSE Building','01995438426','Rejected','2026-11-16 15:37:45'),
(21,3,'Wallet','Accessories','black leather ','2026-11-16','CSE Building','01995438426','Returned','2026-11-16 15:50:10'),
(22,5,'Wallet','Accessories','black leather','2026-11-15','CSE Building','01995438426','Approved','2026-11-16 16:02:02');

SELECT setval('found_items_found_id_seq', (SELECT COALESCE(MAX(found_id), 1) FROM found_items));

-- 4. Lost Items
CREATE TABLE lost_items (
    lost_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    lost_date DATE NOT NULL,
    lost_location TEXT NOT NULL,
    contact_information TEXT NOT NULL,
    secret_information TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    item_image TEXT DEFAULT NULL
);

INSERT INTO lost_items (lost_id, user_id, item_name, category, lost_date, lost_location, contact_information, secret_information, status, created_at, description, item_image) VALUES
(12,2,'Calculator','Electronics','2026-08-21','CSE Class Room','01923170400','MS 570','Approved','2026-08-21 20:05:37','Black Color',NULL),
(15,3,'mobile','Electronics','2026-08-30','CSE Class Room','01923170400','Redmi 13','Returned','2026-08-31 16:46:30','Redmi',NULL),
(16,2,'Calculator','Electronics','2026-08-31','CSE Class Room','01923170400','991 ms','Approved','2026-08-31 19:32:10','Black Color',NULL),
(17,2,'Laptop','Electronics','2026-08-31','CSE Class Room','01923170400','HP','Returned','2026-08-31 20:29:00','Blue',NULL),
(18,3,'watch','Electronics','2026-09-01','Lab','01923170400','dial golden','Returned','2026-08-31 21:11:11','Black',NULL),
(19,3,'Samsung Galaxy A15','Electronics','2026-09-02','CSE Class Room','01923170400','There is a small blue sticker inside the back cover. The phone wallpaper is a picture of a white flower.','Returned','2026-09-01 19:23:30','Black Color Smartphone with a transparent black cover.',NULL),
(20,2,'Wallet','Accessories','2026-09-03','CSE Class Room','01923170400','There is a small family photo and a few receipts inside the wallet.','Returned','2026-09-03 14:52:41','A Caramel colored wallet was lost on the campus.','uploads/1788447161_6a9989b96235e.jpeg'),
(21,4,'Samsung Galaxy A20','Electronics','2026-09-03','CSE Class Room','01923170400','With White Cover','Approved','2026-09-03 15:55:22','Red Color',NULL),
(26,2,'Calculator','Electronics','2026-09-03','CSE Class Room','01923170400','MS 991','Rejected','2026-09-03 17:32:49','White',NULL),
(27,3,'mobile','Electronics','2026-09-03','CSE Class Room','01923170400','Vivo A 15','Rejected','2026-09-03 17:36:00','Vivo',NULL),
(28,3,'watch','Electronics','2026-09-04','CSE Class Room','01923170400','scratch in the strap','Returned','2026-09-03 17:45:43','Black digital watch with black strap','uploads/1788457543_6a99b2473199b.jpeg'),
(29,2,'Samsung Galaxy A54','Electronics','2026-09-24','CSE Building','01923170400','There is a small sticker inside the phone cover.','Returned','2026-09-24 16:56:10','Black Color Samsung Galaxy A54 Phone.','uploads/1790268970_6ab5562aa8eb9.jpeg'),
(31,2,'Wallet','Accessories','2026-11-16','CSE Building','01923170400','contains ID card','Returned','2026-11-16 15:56:10','black leather','uploads/1794844570_6afb279ac524f.jpg'),
(32,2,'id card','Documents','2026-11-22','CSE Class Room','01923170400','','Approved','2026-11-22 11:13:03','blue','uploads/1795345983_6b02ce3f5e106.jpg');

SELECT setval('lost_items_lost_id_seq', (SELECT COALESCE(MAX(lost_id), 1) FROM lost_items));

-- 5. Matches
CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,
    lost_id INT NOT NULL REFERENCES lost_items(lost_id) ON DELETE CASCADE,
    found_id INT NOT NULL REFERENCES found_items(found_id) ON DELETE CASCADE,
    item_name_score NUMERIC(5,2) DEFAULT 0.00,
    description_score NUMERIC(5,2) DEFAULT 0.00,
    category_score NUMERIC(5,2) DEFAULT 0.00,
    location_score NUMERIC(5,2) DEFAULT 0.00,
    date_score NUMERIC(5,2) DEFAULT 0.00,
    match_percentage NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finder_status VARCHAR(20) DEFAULT 'Pending',
    owner_status VARCHAR(20) DEFAULT 'Pending',
    claim_status VARCHAR(20) NOT NULL DEFAULT 'Not Claimed'
);

INSERT INTO matches (match_id, lost_id, found_id, item_name_score, description_score, category_score, location_score, date_score, match_percentage, status, created_at, finder_status, owner_status, claim_status) VALUES
(11,12,5,100.00,100.00,100.00,72.73,80.00,92.55,'Pending','2026-08-21 20:07:58','Pending','Received','Not Claimed'),
(13,15,8,100.00,100.00,100.00,72.73,80.00,92.55,'Returned','2026-08-31 16:48:38','Give Back','Received','Not Claimed'),
(14,16,5,100.00,100.00,100.00,72.73,0.00,84.55,'Pending','2026-08-31 20:11:08','Pending','Pending','Not Claimed'),
(15,17,10,100.00,100.00,100.00,72.73,80.00,92.55,'Returned','2026-08-31 20:29:52','Give Back','Received','Approved'),
(16,18,11,100.00,100.00,100.00,100.00,80.00,98.00,'Returned','2026-08-31 21:12:14','Give Back','Received','Approved'),
(17,19,12,100.00,87.85,100.00,100.00,80.00,93.14,'Returned','2026-09-01 19:25:22','Give Back','Received','Approved'),
(18,20,13,100.00,58.82,100.00,100.00,100.00,83.53,'Returned','2026-09-03 15:39:13','Give Back','Received','Approved'),
(23,28,18,100.00,100.00,100.00,100.00,90.00,99.00,'Returned','2026-09-03 17:47:02','Give Back','Received','Approved'),
(24,29,19,100.00,91.18,100.00,100.00,100.00,96.47,'Returned','2026-09-24 17:03:10','Give Back','Received','Approved'),
(25,31,21,100.00,100.00,100.00,100.00,100.00,100.00,'Returned','2026-11-16 15:56:26','Give Back','Received','Approved'),
(26,31,22,100.00,100.00,100.00,100.00,90.00,99.00,'Pending','2026-11-16 16:02:29','Pending','Pending','Rejected');

SELECT setval('matches_match_id_seq', (SELECT COALESCE(MAX(match_id), 1) FROM matches));

-- 6. Notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    match_id INT REFERENCES matches(match_id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receiver VARCHAR(20) DEFAULT NULL
);

INSERT INTO notifications (notification_id, user_id, match_id, title, message, is_read, created_at, receiver) VALUES
(1,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-03 20:14:49','admin'),
(3,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-21 12:38:18','admin'),
(4,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-21 16:37:28','admin'),
(5,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-21 19:47:33','admin'),
(6,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-21 19:49:27','admin'),
(7,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-21 20:05:37','admin'),
(8,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-21 20:06:01','admin'),
(12,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-30 20:34:52','admin'),
(13,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-30 20:36:28','admin'),
(14,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-31 16:46:30','admin'),
(15,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-31 16:47:22','admin'),
(16,3,13,'Possible Match Found','Your lost item ''mobile'' has a possible match with found item ''mobile''. Match percentage: 92.55%',1,'2026-08-31 16:48:38','user'),
(18,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-31 19:32:10','admin'),
(19,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-31 20:10:48','admin'),
(20,2,14,'Possible Match Found','Your lost item ''Calculator'' has a possible match with found item ''Calculator''. Match percentage: 84.55%',1,'2026-08-31 20:11:08','user'),
(21,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-31 20:29:00','admin'),
(22,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-31 20:29:31','admin'),
(23,2,15,'Possible Match Found','Your lost item ''Laptop'' has a possible match with found item ''Laptop''. Match percentage: 92.55%.',1,'2026-08-31 20:29:52','user'),
(24,3,15,'Possible Match Found','Your found item ''Laptop'' has a possible match with lost item ''Laptop''. Match percentage: 92.55%.',1,'2026-08-31 20:29:52','user'),
(25,3,15,'New Claim Request','The owner has claimed "Laptop". Please review the claim request.',1,'2026-08-31 20:45:38','user'),
(26,2,15,'Claim Request Approved','Your claim request for "Laptop" has been approved by the finder. You can now continue with the Give / Receive process.',1,'2026-08-31 21:08:17','user'),
(27,2,15,'Finder Confirmed Give Back','The finder has confirmed Give Back for "Laptop". Please confirm receipt by clicking Receive.',1,'2026-08-31 21:08:31','user'),
(28,3,15,'Item Received','The owner has confirmed that "Laptop" has been received.',1,'2026-08-31 21:08:52','user'),
(29,2,15,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-08-31 21:08:52','user'),
(30,3,15,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-08-31 21:08:52','user'),
(31,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-08-31 21:11:11','admin'),
(32,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-08-31 21:11:43','admin'),
(34,2,16,'Possible Match Found','Your found item ''watch'' has a possible match with lost item ''watch''. Match percentage: 98%.',1,'2026-08-31 21:12:14','user'),
(35,2,16,'New Claim Request','The owner has claimed "watch". Please review the claim request.',1,'2026-08-31 21:13:31','user'),
(36,3,16,'Claim Request Approved','Your claim request for "watch" has been approved by the finder. You can now continue with the Give / Receive process.',1,'2026-08-31 21:19:42','user'),
(40,2,16,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-08-31 21:20:57','user'),
(41,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-01 19:23:30','admin'),
(42,4,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-01 19:24:58','admin'),
(43,3,17,'Possible Match Found','Your lost item ''Samsung Galaxy A15'' has a possible match with found item ''Samsung Galaxy A15''. Match percentage: 93.14%.',0,'2026-09-01 19:25:22','user'),
(44,4,17,'Possible Match Found','Your found item ''Samsung Galaxy A15'' has a possible match with lost item ''Samsung Galaxy A15''. Match percentage: 93.14%.',0,'2026-09-01 19:25:22','user'),
(45,4,17,'New Claim Request','The owner has claimed "Samsung Galaxy A15". Please review the claim request.',0,'2026-09-01 19:26:41','user'),
(46,3,17,'Claim Request Approved','Your claim request for "Samsung Galaxy A15" has been approved by the finder. You can now view the approved claim details.',1,'2026-09-01 19:27:53','user'),
(48,4,17,'Item Received','The owner has confirmed that "Samsung Galaxy A15" has been received.',1,'2026-09-01 19:29:50','user'),
(49,3,17,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-09-01 19:29:50','user'),
(50,4,17,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',0,'2026-09-01 19:29:50','user'),
(51,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 14:52:41','admin'),
(52,4,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 15:38:33','admin'),
(53,2,18,'Possible Match Found','Your lost item ''Wallet'' has a possible match with found item ''Wallet''. Match percentage: 83.53%.',1,'2026-09-03 15:39:13','user'),
(54,4,18,'Possible Match Found','Your found item ''Wallet'' has a possible match with lost item ''Wallet''. Match percentage: 83.53%.',1,'2026-09-03 15:39:13','user'),
(55,4,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 15:55:22','admin'),
(56,4,NULL,'Post Approved','Your lost item post ''Samsung Galaxy A20'' has been approved by the admin.',1,'2026-09-03 15:55:37','user'),
(57,4,18,'New Claim Request','The owner has claimed "Wallet". Please review the claim request.',0,'2026-09-03 15:56:37','user'),
(58,2,18,'Claim Request Approved','Your claim request for "Wallet" has been approved by the finder. You can now view the approved claim details.',1,'2026-09-03 16:21:29','user'),
(59,2,18,'Finder Confirmed Give Back','The finder has confirmed Give Back for "Wallet". Please confirm receipt by clicking Receive.',1,'2026-09-03 16:22:12','user'),
(60,4,18,'Item Received','The owner has confirmed that "Wallet" has been received.',0,'2026-09-03 16:25:58','user'),
(62,4,18,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',0,'2026-09-03 16:25:58','user'),
(63,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 16:51:57','admin'),
(64,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 16:54:33','admin'),
(66,3,NULL,'Post Approved','Your found item post ''watch'' has been approved by the admin.',1,'2026-09-03 16:55:24','user'),
(67,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:02:56','admin'),
(68,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 17:04:03','admin'),
(70,3,NULL,'Post Approved','Your found item post ''watch'' has been approved by the admin.',1,'2026-09-03 17:04:24','user'),
(71,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:19:41','admin'),
(72,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 17:20:18','admin'),
(74,3,NULL,'Post Approved','Your found item post ''Laptop'' has been approved by the admin.',1,'2026-09-03 17:20:43','user'),
(77,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:24:30','admin'),
(78,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 17:25:46','admin'),
(82,3,NULL,'Post Approved','Your found item post ''watch'' has been approved by the admin.',1,'2026-09-03 17:26:07','user'),
(89,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:32:49','admin'),
(91,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:36:00','admin'),
(92,3,NULL,'Post Rejected','Your lost item post ''mobile'' has been rejected by the admin.',1,'2026-09-03 17:37:33','user'),
(93,3,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-03 17:45:43','admin'),
(94,3,NULL,'Post Approved','Your lost item post ''watch'' has been approved by the admin.',1,'2026-09-03 17:46:19','user'),
(95,4,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-03 17:46:48','admin'),
(96,4,NULL,'Post Approved','Your found item post ''watch'' has been approved by the admin.',0,'2026-09-03 17:47:02','user'),
(97,3,23,'Possible Match Found','A possible match was found for your lost item ''watch''. Match percentage: 99.00%.',1,'2026-09-03 17:47:02','user'),
(98,4,23,'Possible Match Found','A possible match was found for the item you found ''watch''. Match percentage: 99.00%.',0,'2026-09-03 17:47:02','user'),
(99,4,23,'New Claim Request','The owner has claimed "watch". Please review the claim request.',0,'2026-09-03 17:53:11','user'),
(100,3,23,'Claim Request Approved','Your claim request for "watch" has been approved by the finder. You can now view the approved claim details.',1,'2026-09-03 17:53:36','user'),
(101,3,23,'Finder Confirmed Give Back','The finder has confirmed Give Back for "watch". Please confirm receipt by clicking Receive.',1,'2026-09-03 17:53:54','user'),
(102,4,23,'Item Received','The owner has confirmed that "watch" has been received.',0,'2026-09-03 17:54:33','user'),
(103,3,23,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-09-03 17:54:33','user'),
(104,4,23,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',0,'2026-09-03 17:54:33','user'),
(105,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-09-24 16:56:10','admin'),
(106,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-09-24 16:57:35','admin'),
(107,2,NULL,'Post Approved','Your lost item post ''Samsung Galaxy A54'' has been approved by the admin.',0,'2026-09-24 17:03:04','user'),
(108,3,NULL,'Post Approved','Your found item post ''Samsung Galaxy A54'' has been approved by the admin.',1,'2026-09-24 17:03:10','user'),
(109,2,24,'Possible Match Found','A possible match was found for your lost item ''Samsung Galaxy A54''. Match percentage: 96.47%.',1,'2026-09-24 17:03:10','user'),
(110,3,24,'Possible Match Found','A possible match was found for the item you found ''Samsung Galaxy A54''. Match percentage: 96.47%.',1,'2026-09-24 17:03:10','user'),
(111,3,NULL,'Post Approved','Your found item post ''Samsung Galaxy A54'' has been approved by the admin.',1,'2026-09-24 17:03:14','user'),
(112,3,24,'New Claim Request','The owner has claimed "Samsung Galaxy A54". Please review the claim request.',1,'2026-09-24 17:05:00','user'),
(113,2,24,'Claim Request Approved','Your claim request for "Samsung Galaxy A54" has been approved by the finder. You can now view the approved claim details.',1,'2026-09-24 17:05:34','user'),
(114,2,24,'Finder Confirmed Give Back','The finder has confirmed Give Back for "Samsung Galaxy A54". Please confirm receipt by clicking Receive.',1,'2026-09-24 17:08:23','user'),
(115,3,24,'Item Received','The owner has confirmed that "Samsung Galaxy A54" has been received.',1,'2026-09-24 17:08:40','user'),
(116,2,24,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-09-24 17:08:40','user'),
(117,3,24,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-09-24 17:08:40','user'),
(118,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-11-16 15:35:21','admin'),
(119,2,NULL,'Post Approved','Your lost item post ''Wallet'' has been approved by the admin.',1,'2026-11-16 15:36:57','user'),
(120,2,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-11-16 15:37:45','admin'),
(121,2,NULL,'Post Rejected','Your found item post ''Wallet'' has been rejected by the admin.',1,'2026-11-16 15:48:28','user'),
(122,3,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-11-16 15:50:10','admin'),
(123,3,NULL,'Post Approved','Your found item post ''Wallet'' has been approved by the admin.',1,'2026-11-16 15:50:37','user'),
(124,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-11-16 15:56:10','admin'),
(125,2,NULL,'Post Approved','Your lost item post ''Wallet'' has been approved by the admin.',1,'2026-11-16 15:56:26','user'),
(126,2,25,'Possible Match Found','A possible match was found for your lost item ''Wallet''. Match percentage: 100.00%.',1,'2026-11-16 15:56:26','user'),
(128,5,NULL,'New Found Item Post','A new found item is waiting for approval.',0,'2026-11-16 16:02:02','admin'),
(129,5,NULL,'Post Approved','Your found item post ''Wallet'' has been approved by the admin.',1,'2026-11-16 16:02:29','user'),
(130,2,26,'Possible Match Found','A possible match was found for your lost item ''Wallet''. Match percentage: 99.00%.',1,'2026-11-16 16:02:29','user'),
(131,5,26,'Possible Match Found','A possible match was found for the item you found ''Wallet''. Match percentage: 99.00%.',1,'2026-11-16 16:02:29','user'),
(132,3,25,'New Claim Request','The owner has claimed "Wallet". Please review the claim request.',1,'2026-11-16 16:03:18','user'),
(133,2,25,'Claim Request Approved','Your claim request for "Wallet" has been approved by the finder. You can now view the approved claim details.',1,'2026-11-16 16:04:31','user'),
(134,2,25,'Finder Confirmed Give Back','The finder has confirmed Give Back for "Wallet". Please confirm receipt by clicking Receive.',1,'2026-11-16 16:06:31','user'),
(135,3,25,'Item Received','The owner has confirmed that "Wallet" has been received.',0,'2026-11-16 16:06:52','user'),
(136,2,25,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',1,'2026-11-16 16:06:52','user'),
(137,3,25,'Item Successfully Returned','The Give Back and Receive process has been completed. The item has been marked as Returned.',0,'2026-11-16 16:06:52','user'),
(138,5,26,'New Claim Request','The owner has claimed "Wallet". Please review the claim request.',1,'2026-11-16 16:07:16','user'),
(139,2,26,'Claim Request Rejected','Your claim request for "Wallet" has been rejected by the finder.',1,'2026-11-16 16:08:00','user'),
(140,2,NULL,'New Lost Item Post','A new lost item is waiting for approval.',0,'2026-11-22 11:13:03','admin'),
(141,2,NULL,'Post Approved','Your lost item post ''id card'' has been approved by the admin.',0,'2026-11-22 11:13:25','user');

SELECT setval('notifications_notification_id_seq', (SELECT COALESCE(MAX(notification_id), 1) FROM notifications));
