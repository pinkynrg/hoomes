from datetime import datetime
from peewee import Model, TextField, CharField, FloatField, IntegerField, SqliteDatabase, DateTimeField
# PostgresqlDatabase, 

DATABASE_NAME = 'data.db'

# Initialize the SQLite database connection
db = SqliteDatabase(DATABASE_NAME)


# Specify the PostgreSQL connection details
# DATABASE_NAME = 'hoomes'  # Name of the database
# USER = 'postgres'  # Your PostgreSQL username
# PASSWORD = ''  # Your PostgreSQL password
# HOST = 'localhost'  # Hostname or IP address of the PostgreSQL server
# PORT = 5432  # PostgreSQL port (default is 5432)

# Initialize the PostgreSQL database connection
# db = PostgresqlDatabase(DATABASE_NAME, user=USER, password=PASSWORD, host=HOST, port=PORT)

class Location(Model):
    codice = CharField(primary_key=True)
    nome = CharField()    
    zona_codice = CharField()
    zona_nome = CharField()
    regione_codice = CharField()
    regione_nome = CharField()
    provincia_codice = CharField()
    provincia_nome = CharField()
    sigla = CharField()
    codiceCatastale = CharField()
    cap = CharField()
    popolazione = IntegerField()

    class Meta:
        database = db
        table_name = 'locations'

class House(Model):
    uuid = CharField(primary_key=True)
    url = CharField()
    image = CharField()
    title = CharField()
    location = CharField()
    m2 = IntegerField()
    city = CharField()
    province = CharField()
    price = FloatField()
    comment = TextField()
    source = CharField()
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    def serialize(self):
        return {
            'uuid': self.uuid,
            'url': self.url,
            'image': self.image,
            'title': self.title,
            'location': self.location,
            'm2': self.m2,
            'city': self.city,
            'province': self.province,
            'price': self.price,
            'comment': self.comment,
            'source': self.source,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    class Meta:
        database = db
        table_name = 'houses'

# Create or connect to the database
db.connect()

# Create tables if they don't exist
db.create_tables([Location,House], safe=True)

def upsert_record(model_class, unique_field, **kwargs):
    try:
        # Try to find a record with the given unique field value
        existing_record = model_class.get_or_none(**{unique_field: kwargs.get(unique_field)})

        if existing_record:
            # If the record exists, update its attributes
            for field, value in kwargs.items():
                if field != unique_field:
                    setattr(existing_record, field, value)

            existing_record.updated_at = datetime.now()  # Update the 'updated_at' field
            existing_record.save()
        else:
            # If the record doesn't exist, create a new one
            model_class.create(**kwargs)
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()  # Close the database connection