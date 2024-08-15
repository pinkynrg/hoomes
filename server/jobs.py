from services.scraper import Caasa
from datetime import datetime, timedelta
from db import House, upsert_record
from db import Location

from peewee import fn

def fetch_homes(location: Location): 
    # Check if the lowest updated_at of House is > 1 day ago
    one_day_ago = datetime.now() - timedelta(seconds=60)
    lowest_updated_at = House.select(fn.Min(House.updated_at)).where((House.city == location.nome) & (House.province == location.provincia_nome)).scalar()

    if lowest_updated_at is None or lowest_updated_at < one_day_ago:
        # Fetch data from Idealista
        data = Caasa.fetch(location)

        # Update the House records or insert new ones
        for item in data:
            upsert_record(
                House,
                unique_field='uuid',
                uuid=item['uuid'],
                url=item['url'],
                image=item['image'],
                title=item['title'],
                location=item['location'],
                m2=item['m2'],
                city=item['comune'],
                province=location.provincia_nome,
                price=item['price'],
                comment=item['comment'],
                source=item['source'],
            )

    # Return all House records with comune equal to the input
    records = House.select().where((House.city == location.nome) & (House.province == location.provincia_nome))
    return [record.serialize() for record in records]


