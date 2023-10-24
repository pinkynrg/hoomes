from services import emailer, scraper
from worker import conn
from rq import Queue, get_current_job

q = Queue(connection=conn, default_timeout=3600)

def fetch_data(email, comune):
  emailer.send_email(email, f"received you request for {comune}", f"received you request for {comune}")
  data = scraper.Idealista.fetch(comune)
  print(data)
  return data

def save_data(email, comune):
  current_job = get_current_job(conn)
  first_job_id = current_job.dependencies[0].id
  data = q.fetch_job(first_job_id).result
  print(f"need to save following data: {data}")
  emailer.send_email(email, "data was fetch for {comune}!", "data was fetch for {comune}!")