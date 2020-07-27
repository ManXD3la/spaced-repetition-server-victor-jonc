BEGIN;

TRUNCATE
  "word",
  "language",
  "user";

INSERT INTO "user" ("id", "username", "name", "password")
VALUES
  (
    1,
    'admin',
    'Dunder Mifflin Admin',
    -- password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'
  );

INSERT INTO "language" ("id", "name", "user_id")
VALUES
  (1, 'Spanish', 1);

INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
VALUES
  (1, 1, 'cangrejo', 'crab', 2),
  (2, 1, 'manzana', 'apple', 3),
  (3, 1, 'hola', 'hello', 4),
  (4, 1, 'dormitorio', 'bedroom', 5),
  (5, 1, 'cuchara', 'spoon', 6),
  (6, 1, 'desarrollador', 'developer', 7),
  (7, 1, 'juego', 'game', 8),
  (8, 1, 'coche', 'car', 9);
  (9, 1, 'azul', 'blue', 10);
  (10, 1, 'casa', 'house', 11);
  (11, 1, 'ingeniero', 'engineer', 12);
  (12, 1, 'divertido', 'fun', null);

--   crab - cangrejo
-- apple - manzana
-- hello - hola
-- bedroom - dormitorio
-- spoon - cuchara
-- developer - desarrollador
-- game - juego
-- car - coche
-- blue - azul
-- house - casa
-- engineer - ingeniero
-- fun - divertido

UPDATE "language" SET head = 1 WHERE id = 1;

-- because we explicitly set the id fields
-- update the sequencer for future automatic id setting
SELECT setval('word_id_seq', (SELECT MAX(id) from "word"));
SELECT setval('language_id_seq', (SELECT MAX(id) from "language"));
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));

COMMIT;

-- createdb -U dunder_mifflin spaced-repetition

-- psql -U dunder_mifflin -d spaced-repetition -f ./seeds/seed.tables.sql
