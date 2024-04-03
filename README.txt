--- Vizualizační aplikace ---

Vyžaduje NodeJS (testováno na verzi 20).

Spuštění: 

- cd log-analyzer
- npm install
- npm start

Adresář obsahuje 2 příklady logů: 

- example_log_1.csv - log vygenerovaný vytížením
- example_log_2.csv - menší log určený k demonstraci funkce transakčního zobrazení

--- Vytížení databáze ---

Vyžaduje Python3 a spuštěnou DB PostgreSQL.

Spuštění: python3 log-gen.py <host> <databáze> <uživatel> <heslo> <počet vygenerovaných sekvencí> 
