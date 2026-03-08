-- Aggiunge la forma farmaceutica (es. Compressa, Sciroppo, Gocce) al catalogo
ALTER TABLE medicines ADD COLUMN pharmaceutical_form text;
