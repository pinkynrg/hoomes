from flask import Flask, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db import House

engine = create_engine('sqlite:///data.db')  # Replace with your database URL
Session = sessionmaker(bind=engine)
session = Session()
app = Flask(__name__)

@app.route('/houses', methods=['GET'])
def get_houses():
    houses = session.query(House).all()
      
    house_data = [{'uuid': house.uuid, 'url': house.url, 'title': house.title, 'location': house.location,
                  'm2': house.m2, 'city': house.city, 'price': house.price, 'comment': house.comment,
                  'source': house.source, 'created_at': house.created_at, 'updated_at': house.updated_at} for house in houses]
  
    return jsonify({'houses': house_data})

if __name__ == '__main__':
    app.run(debug=True)