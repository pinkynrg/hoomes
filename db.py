import sqlite3

DATABASE_NAME = 'data.db'

def init_db():
  conn = sqlite3.connect(DATABASE_NAME)
  cursor = conn.cursor()

  # Define the SQL query to create the "houses" table
  create_table_query = """
  CREATE TABLE IF NOT EXISTS houses (
      uuid TEXT PRIMARY KEY,
      url TEXT,
      comment TEXT,
      source TEXT
  );
  """

  cursor.execute(create_table_query)
  return cursor

def upsert_house_record(uuid, url, comment, source):
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    # Define the SQL query for the upsert operation
    upsert_query = """
    INSERT OR REPLACE INTO houses (uuid, url, comment, source)
    VALUES (?, ?, ?, ?);
    """

    # Execute the upsert query with the provided values
    cursor.execute(upsert_query, (uuid, url, comment, source))

    # Commit the changes and close the database connection
    conn.commit()
    conn.close()

