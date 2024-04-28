--- Vizualizační aplikace ---

Vyžaduje NodeJS (vyvíjeno na verzi 20).

Spuštění:

- cd log-analyzer
- npm install (může zobratovat upozornění)
- npm start

--- Vytížení databáze ---

Vyžaduje Python3 a spuštěnou DB PostgreSQL s databází DVD Rental.
Záloha databáze se nachází v souboru dvdrental.zip (zdroj: https://www.postgresqltutorial.com/postgresql-getting-started/postgresql-sample-database/)

Spuštění:

- pip install psycopg2
- python3 log-gen.py <host> <databáze> <uživatel> <heslo> <počet vygenerovaných sekvencí>

--- Použítí aplikace ---

Popsáno v dokumentu guide.pdf
