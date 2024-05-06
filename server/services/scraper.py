from utils import get
from bs4 import BeautifulSoup
from db import upsert_record, Location
import concurrent.futures
from functools import partial
from unidecode import unidecode
import json
import re

class ComuniItalia: 
  HOST = "raw.githubusercontent.com"

  def trasform_city_name(name):
    if name == "Reggio nell'Emilia":
      return "Reggio Emilia"
    return name

  def fetch():
    html_text = get(ComuniItalia.HOST, "matteocontrini/comuni-json/master/comuni.json")
    json_string = unidecode(html_text)
    data = json.loads(json_string)
    for comune in data:
      upsert_record(
          Location,
          'codice',
          nome=ComuniItalia.trasform_city_name(comune.get('nome', '')),
          codice=comune.get('codice', ''),
          zona_codice=comune['zona']['codice'] if 'zona' in comune else None,
          zona_nome=comune['zona']['nome'] if 'zona' in comune else None,
          regione_codice=comune['regione']['codice'] if 'regione' in comune else None,
          regione_nome=comune['regione']['nome'] if 'regione' in comune else None,
          provincia_codice=comune['provincia']['codice'] if 'provincia' in comune else None,
          provincia_nome=ComuniItalia.trasform_city_name(comune['provincia']['nome'] if 'provincia' in comune else None),
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

      price = soup.find("span", attrs={"class": "info-data-price"}).find("span").text.replace(".", "")
      title = soup.find("span", attrs={"class": "main-info__title-main"}).text
      location = soup.find("span", attrs={"class": "main-info__title-minor"}).text
      comment = soup.find("div", attrs={"class": "comment"}).find("div").find("p").text
      m2_string = soup.find('div', attrs={"class": "info-features"}).find('span').text
      m2 = int(re.search(r'\d+', m2_string).group())
      image = soup.find('div', attrs={"class": "main-image_first"}).find("img")

      return {
        "uuid": page_link, 
        "url": Idealista.PROTOCOL + Idealista.HOST + page_link, 
        "image": image["src"],
        "m2": m2,
        "source": 'idealista',
        "price": price,
        "comune": comune, 
        "title": title,
        "location": location,
        "comment": comment, 
      }

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

  def fetch( 
      comune, 
      provincia,
      min_price = 1,
      max_price = 1000000,
      min_size = 1,
      max_size = 500,
      **kwargs,
    ):

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
        province=Idealista.format_name(provincia),
        page = page,
        filters=filters or "", 
      )

    collection = []
    next_page = 1
    page_link = get_final_url(next_page)
    total_houses = Idealista.get_total_houses(page_link)

    # max pages offered by Idealista is 60 x 30
    if (total_houses and total_houses > 60 * 30):
      if max_price - min_price > 1:
        mid_price = min_price+int((max_price-min_price)/2)
        collection += Idealista.fetch(
          comune=comune, 
          provincia=provincia,
          min_price=min_price, 
          max_price=mid_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
        collection += Idealista.fetch(
          comune=comune, 
          provincia=provincia,
          min_price=mid_price, 
          max_price=max_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
      else:
        if max_size - min_size > 1:
          mid_size = min_size+int((max_size-min_size)/2)
          collection += Idealista.fetch(
            comune=comune, 
            provincia=provincia,
            min_price=min_price, 
            max_price=max_price, 
            min_size=min_size, 
            max_size=mid_size, 
            **kwargs
          )
          collection += Idealista.fetch(
            comune=comune, 
            provincia=provincia,
            min_price=min_price, 
            max_price=max_price, 
            min_size=mid_size, 
            max_size=max_size, 
            **kwargs
          )
        else:
          pass
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
          for result in executor.map(get_house_data_with_meta, links):
            if result is not None:
              collection += [result]
        next_page = Idealista.get_next_page(html_tree)
        if not next_page: 
          break

    return collection
  
class Caasa: 

  PROTOCOL = "https://"
  HOST = "www.caasa.it"
  ELEMENT_TYPES = [
    'appartamento',
    # 'attico',
    # 'baita',
    # 'bifamiliare',
    # 'campidanese',
    # 'caposchiera',
    # 'casa-indipendente',
    # 'casa-semindipendente',
    # 'casale',
    # 'villa',
    # 'villetta',
    # 'schiera',
  ]

  def get_house_data(comune, page_link):

    def get_value_from_label(soup, label):
      element = soup.find('div', attrs={"class": "opinion-desc-label"}, string='{}:'.format(label))
      if element:
          value = element.find_next_sibling('div', attrs={"class": "opinion-desc-value"}).text.strip()
          return value
      return None
    
    def get_main_image(soup):
      first_carousel_item = soup.find('div', attrs={"class": "carousel-item"})
      if first_carousel_item:
          img_tag = first_carousel_item.find('img')
          return img_tag
      return None
    
    def get_comment(soup):
      return soup.find('div', attrs={"class": "opinion-main-text"}).get_text(strip=True)

    try:
      html_text = get(Caasa.HOST, page_link)
      soup = BeautifulSoup(html_text, "html.parser")
      price = get_value_from_label(soup, "Prezzo")
      title = page_link
      location = get_value_from_label(soup, "Zona OMI")
      comment = get_comment(soup)
      m2_string = get_value_from_label(soup, "Superficie")
      m2 = int(re.search(r'\d+', m2_string).group())
      image = get_main_image(soup)

      return {
        "uuid": page_link, 
        "url": Caasa.PROTOCOL + Caasa.HOST + page_link, 
        "image": image["src"],
        "m2": m2,
        "source": 'caasa.it',
        "price": int(re.sub(r'\D', '', price)),
        "comune": comune, 
        "title": title,
        "location": location,
        "comment": comment, 
      }

    except Exception as e:
      print("ERROR fetching data @ {}: {}".format(page_link, e))

  def format_name(name):
    return name.replace(' ', '-').replace('\'', '-').lower()
  
  def get_total_houses(page_link):
      html_text = get(Caasa.HOST, page_link)
      soup = BeautifulSoup(html_text, "html.parser")
      article = soup.find('article', attrs={"class": "real-estate-article"})
      if article: 
        matches = re.search(r'(\d+)\s+offerte', article.text)
        if matches:
            total_houses = int(matches.group(1))
            return total_houses
      return None
  
  def get_filters_part(
      min_price = None, 
      max_price = None, 
      min_size = None, 
      max_size = None,
    ): 
    result = []

    result += ["euro-a={}".format(max_price) if max_price else None]
    result += ["euro-da={}".format(min_price) if min_price else None]
    result += ["mq-da={}".format(min_size) if min_size else None]
    result += ["mq-a={}".format(max_size) if max_size else None]

    filtered = [e for e in result if e is not None]
    return "&".join(filtered) if len(filtered) else None
  
  def get_next_page(html_tree):
      anchors_container = html_tree.find("div", attrs={"class": "pagination-next"})
      if anchors_container:
        first_anchor = anchors_container.find("a")
        # Check if the anchor element exists
        if first_anchor:
            # Get the value of the href attribute
            page_number_match = re.search(r'page=(\d+)', first_anchor.get("href"))
            if page_number_match:
                return page_number_match.group(1)
        
      return None

  def fetch( 
    location: Location,
    min_price = 1,
    max_price = 1000000,
    min_size = 1,
    max_size = 500,
    **kwargs,
  ):
    
    def get_final_url(page):

      filters = Caasa.get_filters_part(
        min_price = min_price, 
        max_price = max_price, 
        min_size = min_size,
        max_size = max_size,
      )

      return "/{province}/{comune}/{types}/in-vendita.html?page={page}&{filters}".format(
        province=Caasa.format_name(location.provincia_nome),
        comune=Caasa.format_name(location.nome),
        types='-o-'.join(Caasa.ELEMENT_TYPES),
        filters=filters,
        page = page,
      )
    
    def get_house_link(item_html):
      fav_container = item_html.find("div", attrs={"class": "favorite-add"})
      return fav_container['data-canonical']
    
    collection = []
    next_page = 1
    page_link = get_final_url(next_page)
    total_houses = Caasa.get_total_houses(page_link)

    # max pages offered by Idealista is 165 x 22 (18 black + 4 red premium)
    if (total_houses and total_houses > 165 * 22):
      if max_price - min_price > 1:
        mid_price = min_price+int((max_price-min_price)/2)
        collection += Caasa.fetch(
          location=location,
          min_price=min_price, 
          max_price=mid_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
        collection += Caasa.fetch(
          location=location,
          min_price=mid_price, 
          max_price=max_price, 
          min_size=min_size, 
          max_size=max_size, 
          **kwargs
        )
      else:
        if max_size - min_size > 1:
          mid_size = min_size+int((max_size-min_size)/2)
          collection += Caasa.fetch(
            location=location,
            min_price=min_price, 
            max_price=max_price, 
            min_size=min_size, 
            max_size=mid_size, 
            **kwargs
          )
          collection += Caasa.fetch(
            location=location,
            min_price=min_price, 
            max_price=max_price, 
            min_size=mid_size, 
            max_size=max_size, 
            **kwargs
          )
        else:
          pass
    else:
      while True: 
        page_link = get_final_url(next_page)
        html_text = get(Caasa.HOST, page_link)
        html_tree = BeautifulSoup(html_text, "html.parser")
        items_list = html_tree.find_all("div", attrs={"class": "result-item"})
        links = [get_house_link(item) for item in items_list]

        # Create a new function that takes both fixed_param and link
        get_house_data_with_meta = partial(
        Caasa.get_house_data, 
          location.nome,
        )

        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
          for result in executor.map(get_house_data_with_meta, links):
            if result is not None:
              collection += [result]
        next_page = Caasa.get_next_page(html_tree)
        if not next_page: 
          break

    return collection