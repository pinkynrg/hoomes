import redis
import os
from rq import Worker, Queue, Connection

conn = redis.from_url('redis://{host}:{port}/0'.format(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=os.environ.get('REDIS_PORT', '6379'),
))

if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(list(map(Queue, ['default'])))
        worker.work()