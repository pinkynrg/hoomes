from flask import Flask, jsonify, request, Response
from db import Location
from rq import Queue
import http.client
import redis
import os
from services.scraper import Idealista
from playhouse.shortcuts import model_to_dict
from services.scraper import ComuniItalia
from jobs import fetch_homes

app = Flask(__name__)

conn = redis.from_url('redis://{host}:{port}/0'.format(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=os.environ.get('REDIS_PORT', '6379'),
))

q = Queue(connection=conn, default_timeout=3600)

MAX_JOBS = 50

ComuniItalia.fetch()

@app.route('/v1/locations', methods=['GET'])
def get_all_locations():
    locations = Location.select()
    location_list = [model_to_dict(location) for location in locations]
    return jsonify(location_list)

@app.route('/v1/proxy', methods=['GET'])
def proxy_url():
    url = request.args.get('url')  # Get the URL from the query parameter

    if not url:
        return jsonify({'error': 'URL parameter is missing'}), 400

    try:
        # Parse the URL to get the hostname and path
        url_parts = url.split('/', 3)
        if len(url_parts) < 3:
            return jsonify({'error': 'Invalid URL'}), 400

        hostname = url_parts[2]
        path = '/' + url_parts[3]

        # Establish a connection to the remote server
        connection = http.client.HTTPSConnection(hostname)

        headers = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
        }

        # Send an HTTP GET request to the provided URL
        connection.request('GET', path, {}, headers)

        response = connection.getresponse()

        # Check if the request was successful
        if response.status == 200:
            # Set the response content type to HTML
            headers = {'Content-Type': 'text/html; charset=UTF-8'}

            # Return the HTML content from the remote server as a response to the client
            return Response(response.read(), headers=headers)
        else:
            return jsonify({'error': 'Failed to fetch URL'}), 500
    except Exception as e:
        return jsonify({'error': 'Request error'}), 500
    
@app.route('/v1/request', methods=['POST'])
def initiate_job():
    city_codes = request.json.get('codes')

    if city_codes is None:
        response_message = {'error': 'The `codes` parameter is missing', 'code': 'E001'}
        return jsonify(response_message), 400

    if len(city_codes) > MAX_JOBS: 
        response_message = {'error': 'Request fewer cities.', 'code': 'E002'}
        return jsonify(response_message), 400
    
    try:
      coordinates = []
      for city_code in city_codes:
        location = Location.get(codice=city_code)
        coordinates += [(location.nome, location.provincia_nome)]
    except Exception:
      response_message = {'error': 'One or more codes were not valid', 'code': 'E003'}
      return jsonify(response_message), 400

    # Enqueue the scrape job
    jobs = []
    for coordinate in coordinates: 
      jobs += [q.enqueue(fetch_homes, args=coordinate, result_ttl=86400)]

    # Respond with a message indicating the job has been accepted
    response_message = {
        'message': 'Your request has been accepted. We will notify you when it has finished processing.',
        'jobs_id': [job.get_id() for job in jobs]
    }
    return jsonify(response_message), 200
    
@app.route('/v1/jobs/<jobs_id_str>', methods=['GET'])
def check_job_status(jobs_id_str):

    if jobs_id_str is None or jobs_id_str.strip() == "":
        # Return a 400 Bad Request response if "cities" is not supplied
        response_message = {'error': 'The `jobs_id` parameter is missing, empty or malformed', 'code': 'E010'}
        return jsonify(response_message), 400
    
    # split jobs id
    jobs_id = [e.strip() for e in jobs_id_str.split(",")]

    if len(jobs_id) > MAX_JOBS: 
        response_message = {'error': 'Select fewer jobs.', 'code': 'E011'}
        return jsonify(response_message), 400

    jobs_status = []
    
    for job_id in jobs_id:
        job = q.fetch_job(job_id)
        if job is None:
            jobs_status += [{
                'job_id': job_id, 
                'status': 'invalid'
            }]
        else: 
            jobs_status += [{
                'job_id': job_id,
                'status': job.get_status(),
            }]

    finished = all([job_status['status'] in ['invalid', 'failed', 'finished'] for job_status in jobs_status])
    
    result = []
    if finished:
        for job_id in jobs_id:
          job = q.fetch_job(job_id)
          if job is not None and job.result is not None:
            result += job.result
        
    # Check the status of the job
    return jsonify({
        "jobs": jobs_status, 
        "result": result,
        "finished": finished,
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)