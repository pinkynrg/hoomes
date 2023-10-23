from utils import get
from bs4 import BeautifulSoup
from db import upsert_record, House, Location
import concurrent.futures
from functools import partial
import json
import re
# import multiprocessing

class ComuniItalia: 
  HOST = "raw.githubusercontent.com"

  def fetch():
    html_text = get(ComuniItalia.HOST, "matteocontrini/comuni-json/master/comuni.json")
    json_string = html_text
    data = json.loads(json_string)
    for comune in data:
      upsert_record(
          Location,
          'codice',
          nome=comune.get('nome', ''),
          codice=comune.get('codice', ''),
          zona_codice=comune['zona']['codice'] if 'zona' in comune else None,
          zona_nome=comune['zona']['nome'] if 'zona' in comune else None,
          regione_codice=comune['regione']['codice'] if 'regione' in comune else None,
          regione_nome=comune['regione']['nome'] if 'regione' in comune else None,
          provincia_codice=comune['provincia']['codice'] if 'provincia' in comune else None,
          provincia_nome=comune['provincia']['nome'] if 'provincia' in comune else None,
          sigla=comune.get('sigla', ''),
          codiceCatastale=comune.get('codiceCatastale', ''),
          cap=comune['cap'] if 'cap' in comune else None,
          popolazione=comune.get('popolazione', 0)
      )      

class Idealista: 

  PROTOCOL = "https://"
  HOST = "www.idealista.it"


  def format_name(name):
    return name.replace(' ', '-').replace('\'', '-').lower()
  
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

  def get_house_data(comune, page_link):
    try:
      html_text = get(Idealista.HOST, page_link)
      soup = BeautifulSoup(html_text, "html.parser")

      price = soup.find("span", attrs={"class": "info-data-price"}).find("span").contents[0].replace(".", "")
      title = soup.find("span", attrs={"class": "main-info__title-main"}).contents[0]
      location = soup.find("span", attrs={"class": "main-info__title-minor"}).contents[0]
      comment = soup.find("div", attrs={"class": "comment"}).find("div").find("p").contents[0]
      m2_string = soup.find('div', attrs={"class": "info-features"}).find('span').contents[0]
      m2 = int(re.search(r'\d+', m2_string).group())
      image = soup.find('div', attrs={"class": "main-image_first"}).find("img")

      upsert_record(
        House,
        'uuid',
        uuid = page_link, 
        url = Idealista.PROTOCOL + Idealista.HOST + page_link, 
        image = image["src"], 
        title = title,
        location = location,
        comment = comment, 
        m2 = m2,
        source = 'idealista',
        price = price,
        comune = comune, 
      )

      print("SUCCESS fetching data @ {}".format(Idealista.PROTOCOL + Idealista.HOST + page_link))

    except Exception as e:
      print("ERROR fetching data @ {}: {}".format(page_link, e))

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
  
  def get_provincia(nome):
    location = Location.get(nome=nome)
    return location.provincia_nome

  def fetch( 
      comune, 
      min_price = 1,
      max_price = 1000000,
      min_size = 1,
      max_size = 500,
      **kwargs,
    ):


    # TOFIX
    province = Idealista.get_provincia(comune)

    def get_final_url(page):

      filters = Idealista.get_filters_part(
        min_price = min_price, 
        max_price = max_price, 
        min_size = min_size,
        max_size = max_size,
        **kwargs
      )
      
      return "/vendita-case/{comune}-{province}/{filters}lista-{page}.htm?ordine=pubblicazione-desc".format(
        comune=Idealista.format_name(comune),
        province=Idealista.format_name(province),
        page = page,
        filters=filters or "", 
      )
    
    next_page = 1
    page_link = get_final_url(next_page)
    total_houses = Idealista.get_total_houses(page_link)

    # max pages offered by Idealista is 60 x 30
    if (total_houses and total_houses > 60 * 30):
      if max_price - min_price > 1:
        mid_price = min_price+int((max_price-min_price)/2)
        Idealista.fetch(
          comune=comune, 
          min_price=min_price, 
          max_price=mid_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
        Idealista.fetch(
          comune=comune, 
          min_price=mid_price, 
          max_price=max_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
      else:
        if max_size - min_size > 1:
          mid_size = min_size+int((max_size-min_size)/2)
          Idealista.fetch(
            comune=comune, 
            min_price=min_price, 
            max_price=max_price, 
            min_size=min_size, 
            max_size=mid_size, 
            **kwargs
          )
          Idealista.fetch(
            comune=comune, 
            min_price=min_price, 
            max_price=max_price, 
            min_size=mid_size, 
            max_size=max_size, 
            **kwargs
          )
        else:
          return
    else:
      while True: 
        page_link = get_final_url(next_page)
        html_text = get(Idealista.HOST, page_link)
        html_tree = BeautifulSoup(html_text, "html.parser")
        item_container = html_tree.find("section", attrs={"class": "items-list"})
        items_list = item_container.find_all("article", attrs={"class": "item"})
        links = [item.find("a", href=True, attrs={"class": "item-link"})["href"] for item in items_list]
        
        # Create a new function that takes both fixed_param and link
        get_house_data_with_meta = partial(
          Idealista.get_house_data, 
          comune,
        )

        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
          executor.map(get_house_data_with_meta, links)
        next_page = Idealista.get_next_page(html_tree)
        if not next_page: 
          break