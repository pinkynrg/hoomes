import sqlite3
from datetime import datetime 

DATABASE_NAME = 'data.db'

def init_db():
  conn = sqlite3.connect(DATABASE_NAME)
  cursor = conn.cursor()

  # Define the SQL query to create the "houses" table
  create_table_query = """
  CREATE TABLE IF NOT EXISTS houses (
      uuid TEXT PRIMARY KEY,
      url TEXT,
      title TEXT,
      location TEXT,
      m2 INT,
      city TEXT,
      price FLOAT,
      comment TEXT,
      source TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
  );
  """

  cursor.execute(create_table_query)
  return cursor

def upsert_house_record(uuid, url, title, location, comment, m2, source, price, city):
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    # Check if a record with the given UUID already exists
    cursor.execute("SELECT created_at FROM houses WHERE uuid = ?", (uuid,))
    existing_record = cursor.fetchone()

    if existing_record:
        # If the record exists, preserve its 'created_at' timestamp
        created_at = existing_record[0]
    else:
        # If the record doesn't exist, set 'created_at' to the current timestamp
        created_at = datetime.now()

    # Define the SQL query for the upsert operation
    upsert_query = """
    INSERT OR REPLACE INTO houses (uuid, url, title, location, comment, m2, source, price, city, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    # Get the current timestamp for 'updated_at'
    updated_at = datetime.now()

    # Execute the upsert query with the provided values
    cursor.execute(upsert_query, (uuid, url, title, location, comment, m2, source, price, city, created_at, updated_at))

    # Commit the changes and close the database connection
    conn.commit()
    conn.close()

