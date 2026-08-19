from services.scraper import Caasa
from datetime import datetime, timedelta
from db import db, House, upsert_record
from db import Location
from utils import PartialScrapeError

from peewee import fn

CACHE_MAX_AGE = timedelta(days=1)


def fetch_homes(location: Location):
    """Scrape one comune and return everything we hold for it.

    Any failure raises: the job must be reported as failed rather than
    returning an empty list, which the caller cannot tell apart from a comune
    that genuinely has nothing for sale.
    """
    now = datetime.now()
    cache_cutoff = now - CACHE_MAX_AGE
    lowest_updated_at = House.select(fn.Min(House.updated_at)).where((House.city == location.nome) & (House.province == location.provincia_nome)).scalar()

    if lowest_updated_at is None or lowest_updated_at < cache_cutoff:
        # Listings we already hold and consider current: the scraper reports
        # them as seen without re-fetching, so retrying a throttled comune only
        # pays for what is actually missing.
        known_uuids = {
            house.uuid for house in House
            .select(House.uuid)
            .where(
                (House.city == location.nome)
                & (House.province == location.provincia_nome)
                & (House.updated_at >= cache_cutoff)
            )
        }

        partial_failure = None
        try:
            # Raises HttpError/ScrapeError if the site refuses us or changes shape.
            data = Caasa.fetch(location, known_uuids=known_uuids)
        except PartialScrapeError as error:
            # Keep what came back so the next attempt starts further along.
            data = error.collected
            partial_failure = error

        if data:
            # Keep track of the updated UUIDs
            updated_uuids = []

            with db.atomic():
                # Update the House records or insert new ones
                for item in data:
                    if item.get('cached'):
                        # Untouched this run, but still on the portal.
                        updated_uuids.append(item['uuid'])
                        continue

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
                        updated_at=now
                    )
                    updated_uuids.append(item['uuid'])

                # Delete the listings that are gone from the portal. Skipped on
                # an incomplete scrape, whose list of seen uuids is missing the
                # pages we never got to read. Never runs on an empty scrape
                # either: `uuid NOT IN ()` compiles to `1 = 1`, wiping the comune.
                if partial_failure is None:
                    House.delete().where(
                        (House.city == location.nome) &
                        (House.province == location.provincia_nome) &
                        (House.uuid.not_in(updated_uuids))
                    ).execute()
        elif partial_failure is None:
            print('No listings returned for {} ({}): keeping the cached rows'.format(
                location.nome, location.provincia_nome,
            ))

        if partial_failure is not None:
            # Progress is saved; the job still fails so the run is reported as
            # incomplete and the comune can be picked up again later.
            raise partial_failure

    # Return all House records with comune equal to the input
    records = House.select().where((House.city == location.nome) & (House.province == location.provincia_nome))
    return [record.serialize() for record in records]
