# Hoomes documentation

This is the official repo of Hoomes

# Test dispatcher

To test dispatcher `poetry run python server.py` needs to be executed
and the file needs to be patched accordingly to only test the needed code 

## Bootstrap Development

```
// build the image
docker compose -f docker-compose.development.yml build

// start container 
docker compose -f docker-compose.development.yml up -d

// install dependencies 
docker exec -ti hoomes_backend poetry add something

// start server (should be already started when executing docker compose up)
docker exec -ti hoomes_backend poetry run python server.py

// start worker
docker exec -ti hoomes_workers poetry run python worker.py
```