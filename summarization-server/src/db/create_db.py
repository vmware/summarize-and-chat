# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import os
import psycopg2

from src.utils.env import _env

def get_connection(pg_config):
    host = pg_config['PG_HOST']
    port = pg_config['PG_PORT']
    user = pg_config['PG_USER']
    passwd = pg_config['PG_PASSWD']
    dbname = pg_config['PG_DATABASE']     
    
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=passwd,
        host=host,
        port=port,
    )

    return conn

def create_db():
    pg_config = _env.get_db_values()
    try:
        conn = get_connection(pg_config)
        conn.autocommit = True

        # cursor = conn.cursor()
        # cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        # cursor.close()

        cursor = conn.cursor()

        cursor.execute("""CREATE TABLE IF NOT EXISTS documents(
            id SERIAL PRIMARY KEY,
            email VARCHAR (100)  NOT NULL,
            file VARCHAR (256) NOT NULL,
            status VARCHAR (20) NOT NULL,
            questions TEXT [],
            created_at TIMESTAMP default now(),
            UNIQUE (email, file));
            """)
        cursor.close()
        
        cursor = conn.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS chat_doc(
            id SERIAL PRIMARY KEY,
            email VARCHAR (100)  NOT NULL,
            file VARCHAR (256) NOT NULL,
            user_query text NOT NULL,
            assistant_answer text,
            create_time TIMESTAMP default now());
            """)
        cursor.close()

        cursor = conn.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS summarizer_user(
            id SERIAL PRIMARY KEY,
            fname VARCHAR (100)  NOT NULL,
            lname VARCHAR (100)  NOT NULL,
            email VARCHAR (100)  NOT NULL,
            create_time TIMESTAMP default now(),
            UNIQUE (email));
            """)
        cursor.close()

        print("Database setup completed.")
    except Exception as e:
        # Catch any other unexpected exceptions
        print(f"Unexpected error: {e}")
    finally:
        # Close the cursor and connection
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
if __name__ == '__main__':
    create_db()
