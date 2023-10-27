# Hoomes documentation

This is the official repo of Hoomes

## Bootstrap Development

```
// build the image
docker-compose -f docker-compose.development.yml build

// start container 
docker-compose -f docker-compose.development.yml up -d

// install dependencies 
docker exec -ti hoomes-server poetry add something

// start server
docker exec -ti hoomes-server poetry run python server.py

// start worker
docker exec -ti hoomes-workers poetry run python worker.py
```