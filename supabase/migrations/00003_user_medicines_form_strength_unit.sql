-- Aggiunge forma farmaceutica e dosaggio ai farmaci dell'utente
-- Utile soprattutto per inserimenti manuali (farmaco non trovato nel catalogo)
-- Coerente con il catalogo AIFA: pharmaceutical_form e strength (dosaggio)
ALTER TABLE user_medicines ADD COLUMN pharmaceutical_form text;
ALTER TABLE user_medicines ADD COLUMN strength text;
