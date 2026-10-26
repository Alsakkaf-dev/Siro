-- ==========================================================================
-- Seed data (SDD Appendix C test accounts + demo content).
-- Passwords are BCrypt hashes of: Customer@123 / Admin@123 / Driver@123.
-- Restaurants get auto ids 1..5 in listed order (fresh table each boot),
-- so menu_item.restaurant_id references those ids directly.
-- ==========================================================================

INSERT INTO app_user (name, email, password_hash, phone, role) VALUES
 ('Test Customer', 'customer@foodhub.test', '$2a$10$6FHDNVnc.b.RuT30rrAb9uPgKzG.draoe6E/epgTuPtB8cWPiak2K', '0123456789', 'CUSTOMER'),
 ('Test Admin',    'admin@foodhub.test',    '$2a$10$omevfioX33OdrFCAhR.BzeTIyD99pHyr4HcOOIxCc0JLrlH3ggH1i', '0123456780', 'ADMIN'),
 ('Test Driver',   'driver@foodhub.test',   '$2a$10$GYPA7qJKQe2NXH00jmxi2eIDayxd6EAOM5OEW9l9SZuUW81UvWOSi', '0123456781', 'DRIVER');

-- 5 restaurants — Burger Barn is CLOSED (is_open=false) for DT-M1-3 R4.
INSERT INTO restaurant (name, cuisine, rating, location, is_open) VALUES
 ('Nasi Lemak House', 'Malay',    4.6, 'Kuala Lumpur',  TRUE),
 ('Sushi Zen',        'Japanese', 4.8, 'Kuala Lumpur',  TRUE),
 ('Pizza Bella',      'Italian',  4.2, 'Petaling Jaya', TRUE),
 ('Spice of India',   'Indian',   4.5, 'Kuala Lumpur',  TRUE),
 ('Burger Barn',      'American', 3.9, 'Shah Alam',     FALSE);

-- 15 menu items (3 per restaurant). Tuna Roll is unavailable (is_available=false).
INSERT INTO menu_item (restaurant_id, name, description, price, is_available) VALUES
 (1, 'Nasi Lemak Ayam',     'Coconut rice with fried chicken and sambal',   8.50, TRUE),
 (1, 'Nasi Lemak Rendang',  'Coconut rice with slow-cooked beef rendang',  12.00, TRUE),
 (1, 'Teh Tarik',           'Pulled milk tea',                              3.00, TRUE),
 (2, 'Salmon Sushi Set',    'Eight pieces of fresh salmon nigiri',         22.00, TRUE),
 (2, 'Tuna Roll',           'Maki roll with seared tuna',                  15.00, FALSE),
 (2, 'Miso Soup',           'Traditional soybean soup',                     6.00, TRUE),
 (3, 'Margherita Pizza',    'Tomato, mozzarella and basil',                25.00, TRUE),
 (3, 'Pepperoni Pizza',     'Loaded with pepperoni and cheese',            29.00, TRUE),
 (3, 'Garlic Bread',        'Oven-baked with garlic butter',                9.00, TRUE),
 (4, 'Chicken Biryani',     'Fragrant basmati rice with spiced chicken',   14.00, TRUE),
 (4, 'Butter Naan',         'Soft flatbread brushed with butter',           4.50, TRUE),
 (4, 'Mango Lassi',         'Sweet yoghurt mango drink',                    7.00, TRUE),
 (5, 'Classic Cheeseburger','Beef patty with cheddar',                     16.00, TRUE),
 (5, 'Double Beef Burger',  'Two beef patties, double cheese',             22.00, TRUE),
 (5, 'Fries',               'Crispy salted fries',                          8.00, TRUE);
