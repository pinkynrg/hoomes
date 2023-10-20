from utils import get
from bs4 import BeautifulSoup
from db import init_db, upsert_house_record
import concurrent.futures
from functools import partial
import re
import time

cursor = init_db()

class Idealista: 

  PROTOCOL = "https://"
  HOST = "www.idealista.it"


  def format_name(city):
    return city.replace(' ', '-').lower()
  
  def get_next_page(html_tree):
    anchor = html_tree.find("a", attrs={"class": "icon-arrow-right-after"})
    if anchor:
      page_number_match = re.search(r'/lista-(\d+)', anchor['href'])
      if page_number_match:
          page_number = page_number_match.group(1)
          return page_number    
  
  def get_total_houses(page_link):
    html_text = get(Idealista.HOST, page_link)
    soup = BeautifulSoup(html_text, "html.parser")
    h1_element = soup.find('h1', id='h1-container')
    if h1_element:
      matches = re.search(r'\d+(\.\d+)?', h1_element.text)
      if matches:
          extracted_number = matches.group().replace('.', '')
          extracted_integer = int(extracted_number)
          return extracted_integer

  def get_house_data(city, page_link):
    try:
      html_text = get(Idealista.HOST, page_link)
      soup = BeautifulSoup(html_text, "html.parser")

      price = soup.find("span", attrs={"class": "info-data-price"}).find("span").contents[0].replace(".", "")
      title = soup.find("span", attrs={"class": "main-info__title-main"}).contents[0]
      location = soup.find("span", attrs={"class": "main-info__title-minor"}).contents[0]
      comment = soup.find("div", attrs={"class": "comment"}).find("div").find("p").contents[0]
      m2_string = soup.find('div', class_='info-features').find('span').contents[0]
      m2 = int(re.search(r'\d+', m2_string).group())

      upsert_house_record(
        uuid = page_link, 
        url = Idealista.PROTOCOL + Idealista.HOST + page_link, 
        title = title,
        location = location,
        comment = comment, 
        m2 = m2,
        source = 'idealista',
        price = price,
        city = city, 
      )

      print("data {}".format(Idealista.PROTOCOL + Idealista.HOST + page_link))

    except Exception as e:
      print("something went wrong fetching/storing comment @ {}: {}".format(page_link, e))

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
      custom_path = None,
      city = None, 
      sub_category = 'provincia',
      min_price = 1,
      max_price = 1000000,
      min_size = 1,
      max_size = 500,
      **kwargs,
    ):
    
    next_page = 1

    def get_final_url(page):

      filters = Idealista.get_filters_part(
        min_price = min_price, 
        max_price = max_price, 
        min_size = min_size,
        max_size = max_size,
        **kwargs
      )
      
      if custom_path:
        return custom_path.format(
          page = page, 
          filters=filters or "", 

        )
      elif city:
        return "/vendita-case/{city}-{sub_category}/{filters}lista-{page}.htm?ordine=pubblicazione-desc".format(
          city=Idealista.format_name(city),
          sub_category=Idealista.format_name(sub_category),
          page = page,
          filters=filters or "", 
        )
      else: 
        print("insert at least city or custom_path")

    page_link = get_final_url(next_page)
    print("debug {}".format(Idealista.PROTOCOL + Idealista.HOST + page_link))

    total_houses = Idealista.get_total_houses(page_link)

    # max pages offered by Idealista is 60 x 30
    if (total_houses and total_houses > 60 * 30):
      if max_price - min_price > 1:
        mid_price = min_price+int((max_price-min_price)/2)
        Idealista.fetch_links(custom_path=custom_path, city=city, sub_category=sub_category, min_price=min_price, max_price=mid_price, min_size=min_size, max_size=max_size, **kwargs)
        Idealista.fetch_links(custom_path=custom_path, city=city, sub_category=sub_category, min_price=mid_price, max_price=max_price, min_size=min_size, max_size=max_size, **kwargs)
      else:
        if max_size - min_size > 1:
          mid_size = min_size+int((max_size-min_size)/2)
          Idealista.fetch_links(custom_path=custom_path, city=city, sub_category=sub_category, min_price=min_price, max_price=max_price, min_size=min_size, max_size=mid_size, **kwargs)
          Idealista.fetch_links(custom_path=custom_path, city=city, sub_category=sub_category, min_price=min_price, max_price=max_price, min_size=mid_size, max_size=max_size, **kwargs)
        else:
          return
    else:
      while True: 
        page_link = get_final_url(next_page)
        print("links: {}".format(Idealista.PROTOCOL + Idealista.HOST + page_link))
        html_text = get(Idealista.HOST, page_link)
        html_tree = BeautifulSoup(html_text, "html.parser")
        item_container = html_tree.find("section", attrs={"class": "items-list"})
        items_list = item_container.find_all("article", attrs={"class": "item"})
        links = [item.find("a", href=True, attrs={"class": "item-link"})["href"] for item in items_list]
        
        # Create a new function that takes both fixed_param and link
        get_house_data_with_city = partial(Idealista.get_house_data, custom_path or city)

        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
          executor.map(get_house_data_with_city, links)
        next_page = Idealista.get_next_page(html_tree)
        if next_page: 
          print("next page: {}".format(next_page))
        else:
          print("next page is invalid")
          break

        

# Record the start time
# start_time = time.time()
cities = [
#   "Modena",
#   "Parma",
  "Reggio Emilia",
#   "Cremona",
]

for city in cities: 
  Idealista.fetch_links(
    city=city,
    # min_price=64999,
    # max_price=300000,
    # custom_path="/point/vendita-case/9/{filters}lista-{page}?ordine=pubblicazione-desc&shape=%28%28%7B%7CntGwhknA%3F%7Cpp%5B%7CfiI%3F%3F%7Dpp%5B%7DfiI%3F%29%29",
    # min_size=250,
    # max_size=500,
    # ariacondizionata=True,
    # ascensori=True,
  )

# # Record the end time
# end_time = time.time()

# # Calculate the elapsed time
# elapsed_time = end_time - start_time
# print(f"Elapsed time: {elapsed_time} seconds")