import http.client
import re

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

def calculate_match_percentage(comment, words):
    word_count = len(words)
    match_count = sum(1 for word in words if word in comment)
    match_percentage = (match_count / word_count) if word_count > 0 else 0
    return match_percentage

def remove_non_letters_and_split(input_string):
    # Use regular expressions to remove non-letter characters
    letters_only = re.sub(r'[^a-zA-Z\s]', '', input_string)
    # Split the cleaned string into a list of words
    words = letters_only.split()
    return words