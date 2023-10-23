from flask import Flask, jsonify, request, Response
from functools import reduce
import operator
from peewee import fn
from db import House
from utils import calculate_match_percentage, remove_non_letters_and_split
import http.client

app = Flask(__name__)

# Route to get unique regions from the database
@app.route('/v1/regions', methods=['GET'])
def get_regions():
    # Query the database for unique regions
    regions_query = House.select(House.region).distinct()
    regions = [house.region for house in regions_query if house.region]

    # Sort the regions alphabetically
    regions.sort()

    return jsonify(regions)

# Route to get unique provinces from the database, optionally filtered by region
@app.route('/v1/provinces', methods=['GET'])
def get_provinces():
    region = request.args.get('region')
    
    # Query the database for unique provinces
    provinces_query = House.select(House.province)

    if region:
        # If the 'region' parameter is provided, filter by region
        provinces_query = provinces_query.where(House.region == region)

    provinces_query = provinces_query.distinct()
    provinces = [house.province for house in provinces_query if house.province]

    # Sort the provinces alphabetically
    provinces.sort()

    return jsonify(provinces)

# Route to get unique locations from the database, optionally filtered by region and province
@app.route('/v1/locations', methods=['GET'])
def get_locations():
    # Get the user input for region and province (case-insensitive)
    region = request.args.get('region', '').lower()
    province = request.args.get('province', '').lower()
    
    # Build the base query for locations
    locations_query = House.select(House.location)

    # Apply optional filters (case-insensitive)
    if region:
        locations_query = locations_query.where(fn.lower(House.region) == region)
    if province:
        locations_query = locations_query.where(fn.lower(House.province) == province)

    # Sort the results alphabetically (case-sensitive)
    locations_query = locations_query.order_by(House.location)
    locations_query = locations_query.distinct()
    locations = [house.location for house in locations_query if house.location]

    return jsonify(locations)

# Route to get a list of houses with optional filters
@app.route('/v1/houses', methods=['GET'])
def get_houses():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=100, type=int)
    search = request.args.get('search', default='', type=str)
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)
    min_size = request.args.get('min_size', type=int)
    max_size = request.args.get('max_size', type=int)
    region_filter = request.args.getlist('region')
    province_filter = request.args.getlist('province')
    location_filter = request.args.getlist('location')

    # Clean the search query
    words = remove_non_letters_and_split(search)
    regions = [e for e in region_filter if e != '']
    provinces = [e for e in province_filter if e != '']
    locations = [e for e in location_filter if e != '']

    # Query the database for a potentially larger result set without pagination using Peewee
    houses_query = House.select()

    # Apply the region filter if provided
    if regions and len(regions) > 0:
        houses_query = houses_query.where(House.region.in_(regions))

    # Apply the province filter if provided
    if provinces and len(provinces) > 0:
        houses_query = houses_query.where(House.province.in_(provinces))
    
    # Apply the location filter if provided
    if locations and len(locations) > 0:
        houses_query = houses_query.where(House.location.in_(locations))

    # Apply filters for price and size
    if min_price is not None:
        houses_query = houses_query.where(House.price >= min_price)
    if max_price is not None:
        houses_query = houses_query.where(House.price <= max_price)
    if min_size is not None:
        houses_query = houses_query.where(House.m2 >= min_size)
    if max_size is not None:
        houses_query = houses_query.where(House.m2 <= max_size)

    # Apply filter for words in the comment section
    if words:
        # Create a list of conditions, each checking if the comment contains a word
        conditions = [fn.lower(House.comment).contains(word.lower()) for word in words]

        # Combine the conditions using the OR operator
        combined_condition = reduce(operator.or_, conditions)

        # Apply the combined condition to the query
        houses_query = houses_query.where(combined_condition)

    houses = list(houses_query)

    # Serialize the data without marshmallow
    houses_list = [
        {
            'uuid': house.uuid,
            'url': house.url,
            'title': house.title,
            'location': house.location,
            'm2': house.m2,
            'region': house.region,
            'province': house.province,
            'price': house.price,
            'comment': house.comment,
            'source': house.source,
            'image': house.image,
            'match': calculate_match_percentage(house.comment, words)
        }
        for house in houses
    ]

    houses_list.sort(key=lambda house: house['match'], reverse=True)

    # Calculate the offset to skip rows based on the page and page_size
    offset = (page - 1) * page_size
    limited_houses_list = houses_list[offset:offset + page_size]

    return jsonify(limited_houses_list)

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

if __name__ == '__main__':
    app.run(debug=True)