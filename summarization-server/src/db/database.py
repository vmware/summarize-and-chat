# Copyright 2023-2024 Broadcom
# SPDX-License-Identifier: Apache-2.0

import os
import psycopg2

# from sqlalchemy import make_url

from src.utils.env import _env
from src.utils.auth_utils import encode_password
from src.config import logger      
from src.model.file_type import validate_audio
from src.model.data_model import DBUser

class Database:
    def __init__(self, config):
        self.host = config['PG_HOST']
        self.port = config['PG_PORT']
        self.user = config['PG_USER']
        self.passwd = config['PG_PASSWD']
        self.dbname = config['PG_DATABASE']     

    def connect(self):
        conn = psycopg2.connect(
            dbname=self.dbname,
            user=self.user,
            password=self.passwd,
            host=self.host,
            port=self.port,
        )
        return conn

class DocumentDB(Database):
    def __init__(self, config): 
       super().__init__(config)

    def get_document(self, file: str, user: str):
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents where email = %s and file = %s;", (user, file))
            result = cursor.fetchall()
            if result:
                return result
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return None
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
    
    async def get_status(self, file: str, user: str):
        res = 'in process'
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents where email = %s and file = %s;", (user, file))
            result = cursor.fetchall()
            if result:
                column_names = [desc[0] for desc in cursor.description]
                status = None
                for row in result:
                    for column_name, value in zip(column_names, row):
                        if column_name =='status':
                            res = value
                    
            cursor.close()
        except: 
            print('caught exception')
            cursor.close()
        return res
    
    def get_questions(self, file: str, user: str):
        result = None
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents where email = %s and file = %s;", (user, file))
            result = cursor.fetchall()
            if result:
                column_names = [desc[0] for desc in cursor.description]
                for row in result:
                    for column_name, value in zip(column_names, row):
                        if column_name =='questions':
                            result = value
                            return result
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    async def add_document(self, file: str, user: str):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("INSERT INTO documents(email, file, status) VALUES(%s, %s, %s) RETURNING id;", (user, file, 'in process'))
            new_id = cursor.fetchone()[0]
            
            print(f"Newly inserted record ID: {new_id}")
            cursor.close()
            return new_id
        except psycopg2.Error as e:
            # Catch any psycopg2-related exceptions
            print(f"Error: {e.pgcode} - {e.pgerror}")
            # You can) (my_array, user, file))
            cursor.close()
            return 0
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
            return -1
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def update_document(self,file: str, user: str, questions ):            
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("UPDATE documents SET status = 'done', questions = %s WHERE email = %s and file = %s;", (questions, user, file))
            cursor.close()
        except psycopg2.Error as e:
            # Catch any psycopg2-related exceptions
            print(f"Error: {e.pgcode} - {e.pgerror}")
            # You can) (my_array, user, file))
            cursor.close()
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()
            
    def updateStatus(self, file: str, user: str):
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("UPDATE documents SET status = 'done' WHERE email = %s and file = %s;", (user, file))
            cursor.close()
            print("done updateStatus")
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def delete_document(self, id):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("DELETE FROM documents WHERE id = %s", (id,))
            cursor.close()
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    async def create_table(self):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("""CREATE TABLE IF NOT EXISTS documents(
                id SERIAL PRIMARY KEY,
                email VARCHAR (100) NOT NULL,
                file VARCHAR (256) NOT NULL,
                status VARCHAR (20) NOT NULL,
                questions TEXT [],
                created_at TIMESTAMP default now(),
                UNIQUE (email, file));
                """)
            cursor.close()
        except: 
            print('caught exception')
            cursor.close()


    
class ChatDB(Database):
    def __init__(self, config): 
       super().__init__(config)
       
    def add_chat_history(self, query,user,doc,answer):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("INSERT INTO chat_doc(email, file, user_query, assistant_answer) VALUES(%s, %s, %s, %s) RETURNING id;", (user, doc, query, answer))
            new_id = cursor.fetchone()[0]
            
            print(f"Newly inserted record ID: {new_id}")
            cursor.close()
            return new_id
        except psycopg2.Error as e:
            # Catch any psycopg2-related exceptions
            print(f"Error: {e.pgcode} - {e.pgerror}")
            # You can) (my_array, user, file))
            return 0
        except Exception as e:
            # Catch any other unexpected exceptions
            print(f"Unexpected error: {e}")
            return -1
        finally:
            # Close the cursor and connection
            if cursor:
                cursor.close()
            if conn:
                conn.close()
                
    # query history by user name and doc name, hide some attribute and sort by create_time asc
    def get_retrieval_history(self, user, doc):
        # handle audio file
        if validate_audio(doc):
            base_name, _ = os.path.splitext(doc)
            doc = f"{base_name}.vtt"
            
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_doc where email = %s and file = %s ORDER BY create_time ASC;", (user, doc))
            result = cursor.fetchall()
            if result:
                return result
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            # Close the cursor and connection
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
    
    def delete_retrieval_history(self, user,doc):
        # handle audio file
        if validate_audio(doc):
            base_name, _ = os.path.splitext(doc)
            doc = f"{base_name}.vtt"
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("""DELETE from chat_doc WHERE email = %s and file = %s;""", (user, doc))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            # Close the cursor and connection
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()            

class UserDB(Database):
    def __init__(self, config): 
       super().__init__(config)

    def add_user(self, fname, lname, email, password):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("INSERT INTO summarizer_user(fname, lname, email, password) VALUES(%s, %s, %s, %s) RETURNING id;", (fname, lname, email, encode_password(password)))
            new_id = cursor.fetchone()[0]
            user = DBUser()
            user.fname = fname
            user.lname = lname
            user.email - email
            user.password = password
            cursor.close()
            return user
        except psycopg2.Error as e:
            # Catch any psycopg2-related exceptions
            print(f"Error: {e.pgcode} - {e.pgerror}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_user_by_email(self, email):
        try: 
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT id, fname, lname, email FROM summarizer_user where email = %s;", (email))
            result = cursor.fetchall()
            if result:
                dbuser = result[0]
                print(dbuser)
                user = DBUser(fname=dbuser[1], lname=dbuser[2], email=dbuser[3], id=dbuser[0])
                return user
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return None
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def delete_ruser(self, email):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("""DELETE from summarizer_user WHERE email = %s;""", (email))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

    def get_users(self):
        try:
            conn = self.connect()
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM summarizer_user;")
            result = cursor.fetchall()
            if result:
                return result
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return None
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()