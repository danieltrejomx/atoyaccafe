-- Limpiar productos y opciones anteriores
DELETE FROM opciones;
DELETE FROM pedido_items;
DELETE FROM recetas;
DELETE FROM productos;

-- ═══════════════════════════════════════
-- ENSALADAS
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(1, 'Ensalada Tradicional', 'Lechuga, espinaca, tomate cherry, zanahoria, pepino, aguacate, panela, crotones y semilla de girasol.', 'Ensaladas', 70, 1, 1),
(2, 'Ensalada Jamón de pavo', 'La tradicional + jamón de pavo (60 g).', 'Ensaladas', 90, 1, 2),
(3, 'Ensalada de atún', 'La tradicional + atún Dolores (100 g).', 'Ensaladas', 95, 1, 3),
(4, 'Ensalada de pollo', 'La tradicional + pollo a la plancha (120 g).', 'Ensaladas', 100, 1, 4),
(5, 'Ensalada de res', 'La tradicional + fajitas de res (120 g).', 'Ensaladas', 110, 1, 5);

-- Opciones: aderezo
INSERT INTO opciones (producto_id, grupo, nombre, precio_extra, tipo, por_defecto) VALUES
(1, 'Aderezo', 'Ranch', 0, 'unica', 1),
(1, 'Aderezo', 'Mil islas', 0, 'unica', 0),
(2, 'Aderezo', 'Ranch', 0, 'unica', 1),
(2, 'Aderezo', 'Mil islas', 0, 'unica', 0),
(3, 'Aderezo', 'Ranch', 0, 'unica', 1),
(3, 'Aderezo', 'Mil islas', 0, 'unica', 0),
(4, 'Aderezo', 'Ranch', 0, 'unica', 1),
(4, 'Aderezo', 'Mil islas', 0, 'unica', 0),
(5, 'Aderezo', 'Ranch', 0, 'unica', 1),
(5, 'Aderezo', 'Mil islas', 0, 'unica', 0);

-- Opciones: extras ensaladas
INSERT INTO opciones (producto_id, grupo, nombre, precio_extra, tipo, por_defecto) VALUES
(1, 'Extras', 'Huevo cocido', 12, 'multiple', 0),
(1, 'Extras', 'Arándanos deshidratados', 10, 'multiple', 0),
(1, 'Extras', 'Elote', 10, 'multiple', 0),
(1, 'Extras', 'Nuez molida', 15, 'multiple', 0),
(2, 'Extras', 'Huevo cocido', 12, 'multiple', 0),
(2, 'Extras', 'Arándanos deshidratados', 10, 'multiple', 0),
(2, 'Extras', 'Elote', 10, 'multiple', 0),
(2, 'Extras', 'Nuez molida', 15, 'multiple', 0),
(3, 'Extras', 'Huevo cocido', 12, 'multiple', 0),
(3, 'Extras', 'Arándanos deshidratados', 10, 'multiple', 0),
(3, 'Extras', 'Elote', 10, 'multiple', 0),
(3, 'Extras', 'Nuez molida', 15, 'multiple', 0),
(4, 'Extras', 'Huevo cocido', 12, 'multiple', 0),
(4, 'Extras', 'Arándanos deshidratados', 10, 'multiple', 0),
(4, 'Extras', 'Elote', 10, 'multiple', 0),
(4, 'Extras', 'Nuez molida', 15, 'multiple', 0),
(5, 'Extras', 'Huevo cocido', 12, 'multiple', 0),
(5, 'Extras', 'Arándanos deshidratados', 10, 'multiple', 0),
(5, 'Extras', 'Elote', 10, 'multiple', 0),
(5, 'Extras', 'Nuez molida', 15, 'multiple', 0);

-- ═══════════════════════════════════════
-- CHILAQUILES
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(6, 'Chilaquiles sencillos', 'Totopos, salsa verde, crema, queso, cebolla, aguacate y frijoles.', 'Chilaquiles', 65, 1, 1),
(7, 'Chilaquiles con pollo', 'Chilaquiles verdes con pollo (100 g), aguacate y frijoles.', 'Chilaquiles', 90, 1, 2),
(8, 'Chilaquiles con res', 'Chilaquiles verdes con res (100 g), aguacate y frijoles.', 'Chilaquiles', 100, 1, 3);

-- ═══════════════════════════════════════
-- MOLLETES
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(9, 'Molletes sencillos', 'Pan, frijoles refritos y manchego gratinado. Orden de 2 con pico de gallo.', 'Molletes', 50, 1, 1),
(10, 'Molletes Atoyac', 'Frijoles, manchego, tocino y pollo (60 g). Orden de 2 con pico de gallo.', 'Molletes', 80, 1, 2);

-- ═══════════════════════════════════════
-- CHAPATAS
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(11, 'Chapata jamón de pavo', 'Jamón de pavo (80 g), panela, queso manchego, lechuga, tomate, cebolla y mayonesa. Con papas fritas.', 'Chapatas', 80, 1, 1),
(12, 'Chapata de pollo', 'Pollo a la plancha (120 g) con pimiento y cebolla caramelizada, panela, manchego, lechuga, tomate y mayonesa. Con papas fritas.', 'Chapatas', 95, 1, 2),
(13, 'Chapata fajitas de res', 'Fajitas de res (120 g) con pimiento y cebolla caramelizada, panela, manchego, lechuga, tomate y mayonesa. Con papas fritas.', 'Chapatas', 105, 1, 3);

-- Opciones: pan y acompañamiento
INSERT INTO opciones (producto_id, grupo, nombre, precio_extra, tipo, por_defecto) VALUES
(11, 'Pan', 'Normal', 0, 'unica', 1),
(11, 'Pan', 'Integral', 0, 'unica', 0),
(11, 'Acompañamiento', 'Papas fritas', 0, 'unica', 1),
(11, 'Acompañamiento', 'Ensalada', 0, 'unica', 0),
(12, 'Pan', 'Normal', 0, 'unica', 1),
(12, 'Pan', 'Integral', 0, 'unica', 0),
(12, 'Acompañamiento', 'Papas fritas', 0, 'unica', 1),
(12, 'Acompañamiento', 'Ensalada', 0, 'unica', 0),
(13, 'Pan', 'Normal', 0, 'unica', 1),
(13, 'Pan', 'Integral', 0, 'unica', 0),
(13, 'Acompañamiento', 'Papas fritas', 0, 'unica', 1),
(13, 'Acompañamiento', 'Ensalada', 0, 'unica', 0);

-- ═══════════════════════════════════════
-- FRUTA
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(14, 'Plato de fruta', 'Manzana y plátano (200 g) con yogurt, granola y miel.', 'Fruta', 50, 1, 1);

-- ═══════════════════════════════════════
-- POSTRES
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(15, 'Galleta de chocolate', 'Galleta artesanal de chocolate.', 'Postres', 35, 1, 1),
(16, '5 mini donas', 'Porción de 5 mini donas.', 'Postres', 35, 1, 2),
(17, 'Pastel de zanahoria', 'Rebanada de pastel de zanahoria.', 'Postres', 55, 1, 3),
(18, 'Cheesecake', 'Rebanada de cheesecake.', 'Postres', 55, 1, 4);

-- ═══════════════════════════════════════
-- CAFÉ CALIENTE
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(19, 'Café del día', 'Café filtrado del día.', 'Café caliente', 30, 1, 1),
(20, 'Americano', 'Espresso con agua caliente.', 'Café caliente', 35, 1, 2),
(21, 'Café de olla', 'Café de olla tradicional.', 'Café caliente', 35, 1, 3),
(22, 'Espresso', 'Shot de espresso.', 'Café caliente', 40, 1, 4),
(23, 'Latte', 'Espresso con leche vaporizada.', 'Café caliente', 55, 1, 5),
(24, 'Cappuccino', 'Espresso, leche y espuma.', 'Café caliente', 60, 1, 6);

-- ═══════════════════════════════════════
-- BEBIDAS FRÍAS
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(25, 'Tisana 500 ml', 'Agua de horchata infusionada.', 'Bebidas frías', 35, 1, 1),
(26, 'Coca-Cola 355 ml', 'Coca-Cola original.', 'Bebidas frías', 35, 1, 2),
(27, 'Coca-Cola Light 355 ml', 'Coca-Cola Light.', 'Bebidas frías', 35, 1, 3),
(28, 'Agua de horchata 500 ml', 'Agua de horchata natural.', 'Bebidas frías', 35, 1, 4),
(29, 'Agua de jamaica 500 ml', 'Agua de jamaica natural.', 'Bebidas frías', 35, 1, 5);

-- ═══════════════════════════════════════
-- PROMOS
-- ═══════════════════════════════════════
INSERT INTO productos (id, nombre, descripcion, categoria, precio, activo, orden) VALUES
(30, 'Promo Chilaquiles con pollo', 'Chilaquiles con pollo + café americano o cappuccino.', 'Promos', 100, 1, 1),
(31, 'Promo Ensalada', 'Ensalada de pollo o atún + agua.', 'Promos', 100, 1, 2),
(32, 'Promo Pastel de jamón', 'Pastel de jamón + agua.', 'Promos', 100, 1, 3),
(33, 'Promo Cafetera', 'Café del día + 5 mini donas.', 'Promos', 60, 1, 4),
(34, 'Promo Pareja', '2 cappuccinos + pastel de zanahoria o cheesecake.', 'Promos', 160, 1, 5);
