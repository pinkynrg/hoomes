import http.client

headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
}

def request(method, host, path, params, headers = headers):
  conn = http.client.HTTPSConnection(host)
  conn.request(method, path, params, headers)
  res = conn.getresponse()
  data = res.read()
  return data.decode("utf-8")

def get(host, path, params = {}, headers = headers): 
  return request('GET', host, path, params, headers)