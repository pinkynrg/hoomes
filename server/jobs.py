from services import emailer, scraper
from worker import conn
from rq import Queue

q = Queue(connection=conn, default_timeout=3600)

def fetch_data(email, comune):
  emailer.send_email(email, f"received you request for {comune}", f"received you request for {comune}")
  data = scraper.Idealista.fetch(comune)
  return data