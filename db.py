from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_NAME = 'data.db'

Base = declarative_base()

class House(Base):
    __tablename__ = 'houses'
    uuid = Column(String, primary_key=True)
    url = Column(String)
    title = Column(String)
    location = Column(String)
    m2 = Column(Integer)
    city = Column(String)
    price = Column(Float)
    comment = Column(String)
    source = Column(String)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, onupdate=datetime.now)

def init_db():
    engine = create_engine(f'sqlite:///{DATABASE_NAME}', echo=True)  # Use 'echo=True' for debugging
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

def upsert_house_record(uuid, url, title, location, comment, m2, source, price, city):
    engine = create_engine(f'sqlite:///{DATABASE_NAME}')
    Session = sessionmaker(bind=engine)  # Create a session
    session = Session()

    try:
        # Check if a record with the given UUID already exists
        existing_record = session.query(House).filter_by(uuid=uuid).first()

        if existing_record:
            # If the record exists, update its attributes
            existing_record.url = url
            existing_record.title = title
            existing_record.location = location
            existing_record.comment = comment
            existing_record.m2 = m2
            existing_record.source = source
            existing_record.price = price
            existing_record.city = city
        else:
            # If the record doesn't exist, create a new one
            new_record = House(
                uuid=uuid,
                url=url,
                title=title,
                location=location,
                comment=comment,
                m2=m2,
                source=source,
                price=price,
                city=city
            )
            session.add(new_record)
        
        session.commit()

    finally:
        session.close()  # Close the session
