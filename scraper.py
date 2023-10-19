from utils import get
from bs4 import BeautifulSoup
from db import init_db, upsert_house_record
import re
import time

cursor = init_db()

class Idealista: 

  PROTOCOL = "https://"
  HOST = "www.idealista.it"


  def format_name(city):
    return city.replace(' ', '-').lower()
  
  def get_max_page(html_tree):
    pagination = html_tree.find("div", attrs={"class": "pagination"})
    page_containers = pagination.find_all("li", attrs={"class": None})
    page_links = [ c.find("a") for c in page_containers ]
    numbers = [ int(l.contents[0]) for l in page_links if l is not None ]
    max_page = max(numbers)
    return max_page
  
  def get_total_houses(page_link):
    html_text = get(Idealista.HOST, page_link)
    soup = BeautifulSoup(html_text, "html.parser")
    h1_element = soup.find('h1', id='h1-container')
    if h1_element:
      matches = re.search(r'\d+\.?\d+', h1_element.text)
      if matches:
          extracted_number = matches.group().replace('.', '')
          extracted_integer = int(extracted_number)
          return extracted_integer

  def get_house_comment(page_link):
    try:
      # print("fetching comments @ {}".format(Idealista.PROTOCOL + page_link))
      html_text = get(Idealista.HOST, page_link)
      html_tree = BeautifulSoup(html_text, "html.parser")
      div_comment = html_tree.find("div", attrs={"class": "comment"})
      p_comment = div_comment.find("div").find("p")
      return p_comment.contents[0]
    except Exception:
      print("something went wrong fetching comment @ {}".format(page_link))

  def get_filters_part(
      min_price = None, 
      max_price = None, 
      min_size = None, 
      max_size = None,
      ariacondizionata = None,
      ascensori = None,
    ): 
    result = []
    
    result += ["prezzo_{}".format(max_price) if max_price else None]
    result += ["prezzo-min_{}".format(min_price) if min_price else None]
    result += ["dimensione_{}".format(min_size) if min_size else None]
    result += ["dimensione-max_{}".format(max_size) if max_size else None]
    result += ["ariacondizionata" if ariacondizionata else None]
    result += ["ascensori" if ascensori else None]

    filtered = [e for e in result if e is not None]
    return "con-" + ",".join(filtered) + "/" if len(filtered) else None

  def fetch_links( 
      city, 
      sub_category = 'provincia',
      min_price = 1,
      max_price = 1000000,
      **kwargs,
    ):
    
    formatted_city = Idealista.format_name(city)
    formatted_sub = Idealista.format_name(sub_category)
    valid_page = True
    page = 1

    def get_final_url(page):
      page_link = "/vendita-case/{city}-{sub_category}/{filters}".format(
          filters=Idealista.get_filters_part(min_price=min_price, max_price=max_price, **kwargs) or "", 
          city=formatted_city,
          sub_category=formatted_sub,
        )
      return page_link + "lista-{}.htm".format(page)

    page_link = get_final_url(1)
    total_houses = Idealista.get_total_houses(page_link)
    print(Idealista.PROTOCOL + Idealista.HOST + page_link, total_houses)

    # max pages offered by Idealista
    if total_houses > 60 * 30:
      print("Too many houses ({})".format(total_houses))
      Idealista.fetch_links(city=city, sub_category=sub_category, min_price=min_price, max_price=int(max_price/2))
      Idealista.fetch_links(city=city, sub_category=sub_category, min_price=int(max_price/2), max_price=max_price)
      pass
    else:
      while valid_page:
        
        page_link = get_final_url(page)
        print("fetching house links @ {}".format(Idealista.PROTOCOL + Idealista.HOST + page_link))
        html_text = get(Idealista.HOST, page_link)
        html_tree = BeautifulSoup(html_text, "html.parser")
        max_page = Idealista.get_max_page(html_tree)
        valid_page = False if max_page < page else True
        
        if valid_page:
          item_container = html_tree.find("section", attrs={"class": "items-list"})
          items_list = item_container.find_all("article", attrs={"class": "item"})
          for item in items_list:
            link = item.find("a", href=True, attrs={"class": "item-link"})
            house_comment = Idealista.get_house_comment(link["href"])
            keyword_matched = 0
            
            upsert_house_record(
              uuid = link["href"], 
              url = link["href"], 
              comment = house_comment, 
              source = 'idealista'
            )
          page += 1

# Record the start time
start_time = time.time()

response = Idealista.fetch_links(
  city="Reggio Emilia",
  # min_price=1,
  # max_price=200000,
  # min_size=1,
  # max_size=100,
  # ariacondizionata=True,
  # ascensori=True,
)

# Record the end time
end_time = time.time()

# Calculate the elapsed time
elapsed_time = end_time - start_time
print(f"Elapsed time: {elapsed_time} seconds")
