from flask import Flask, jsonify, request, Response
from db import Location
from rq import Queue
import http.client
import redis
import os
from services.scraper import Idealista
from playhouse.shortcuts import model_to_dict
from services.scraper import ComuniItalia

app = Flask(__name__)

conn = redis.from_url('redis://{host}:{port}/0'.format(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=os.environ.get('REDIS_PORT', '6379'),
))

q = Queue(connection=conn, default_timeout=3600)

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
    city = request.json.get('city')
    email = request.json.get('email')

    # Enqueue the scrape job
    job = q.enqueue(Idealista.fetch, args=(city,))

    # Respond with a message indicating the job has been accepted
    response_message = {
        'message': 'Your job has been accepted. We will notify you when it has finished processing.',
        'job_id': job.get_id()  # Provide the job ID for checking status
    }
    return jsonify(response_message), 200
    
@app.route('/v1/jobs/<job_id>', methods=['GET'])
def check_job_status(job_id):
    # Use RQ's get_current_job to retrieve the job by ID
    job = q.fetch_job(job_id)

    if job is None:
        return jsonify({'status': 'Job not found'}), 404

    # Check the status of the job
    return jsonify({
        'status': job.get_status(),
        'result': job.result
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)