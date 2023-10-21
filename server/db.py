from datetime import datetime
from peewee import Model, TextField, CharField, FloatField, IntegerField, SqliteDatabase, DateTimeField, PostgresqlDatabase

# DATABASE_NAME = 'data.db'

# Initialize the SQLite database connection
# db = SqliteDatabase(DATABASE_NAME)


# Specify the PostgreSQL connection details
DATABASE_NAME = 'hoomes'  # Name of the database
USER = 'postgres'  # Your PostgreSQL username
PASSWORD = ''  # Your PostgreSQL password
HOST = 'localhost'  # Hostname or IP address of the PostgreSQL server
PORT = 5432  # PostgreSQL port (default is 5432)

# Initialize the PostgreSQL database connection
db = PostgresqlDatabase(DATABASE_NAME, user=USER, password=PASSWORD, host=HOST, port=PORT)

class House(Model):
    uuid = CharField(primary_key=True)
    url = CharField()
    image = CharField()
    title = CharField()
    location = CharField()
    m2 = IntegerField()
    province = CharField()
    region = CharField()
    price = FloatField()
    comment = TextField()
    source = CharField()
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    
    class Meta:
        database = db
        table_name = 'houses'

# Create or connect to the database
db.connect()

# Create tables if they don't exist
db.create_tables([House], safe=True)

def upsert_house_record(uuid, url, image, title, location, comment, m2, source, price, province, region):
    try:
        # Try to find a record with the given UUID
        existing_record = House.get_or_none(uuid=uuid)

        if existing_record:
            # If the record exists, update its attributes
            existing_record.url = url
            existing_record.image = image
            existing_record.title = title
            existing_record.location = location
            existing_record.comment = comment
            existing_record.m2 = m2
            existing_record.source = source
            existing_record.price = price
            existing_record.province = province
            existing_record.region = region
            existing_record.updated_at = datetime.now()  # Update the 'updated_at' field

            existing_record.save()
        else:
            # If the record doesn't exist, create a new one
            House.create(
                uuid=uuid,
                url=url,
                image=image,
                title=title,
                location=location,
                comment=comment,
                m2=m2,
                source=source,
                price=price,
                province=province,
                region=region,
            )
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()  # Close the database connection