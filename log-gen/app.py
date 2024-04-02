import random
import sys
import threading
import psycopg2
import json

# Define the number of threads and iterations
num_threads = int(sys.argv[5])

# Read command sequences from json
f = open("queries.json")
command_sequences = json.load(f)
f.close()

# Define a function that executes a SQL command sequence


def execute_sql_sequence(sequence, num):
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=sys.argv[1], database=sys.argv[2], user=sys.argv[3], password=sys.argv[4]
    )

    # Create a cursor and execute the SQL commands in the sequence
    cur = conn.cursor()
    for command in sequence:
        cur.execute(command)

    # Commit the changes, close the cursor, and close the connection
    conn.commit()
    cur.close()
    conn.close()

    print("Executed sequence " + str(num))


# Create a list of threads and start them
threads = []
for i in range(num_threads):
    # Select a random sequence from the list of command sequences
    sequence = random.choice(
        command_sequences, weights=map(lambda x: x["weight"], command_sequences)
    )

    # Create a thread that executes the sequence X times
    t = threading.Thread(target=execute_sql_sequence(sequence["sequence"], i))
    t.start()
    threads.append(t)

# Wait for all threads to finish
for t in threads:
    t.join()
