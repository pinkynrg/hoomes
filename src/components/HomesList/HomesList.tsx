import style from './HomesList.module.scss';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce'
import { Button, Dropdown, Form, Input, InputNumber, Pagination, Spin } from 'antd';
import { HomeElement } from '../HomeElement/HomeElement';
import Icon, { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { NumberFormatter, stringToNumber } from '../../utils';
import { NoData } from '../Icons/NoData';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { db } from './../../dbConfig';
import { HomeWithMatch } from '../../types';
import { useLiveQuery } from "dexie-react-hooks";

interface HomesListProps {
  onPreview: (url: string) => void
  className: string
}

const HomesList = ({ 
  onPreview,
  className,
}: HomesListProps) => {
  
  const [search, setSearch] = useState('')
  const [minSize, setMinSize] = useState<string | undefined>()
  const [maxSize, setMaxSize] = useState<string | undefined>()
  const [minPrice, setMinPrice] = useState<string | undefined>()
  const [maxPrice, setMaxPrice] = useState<string | undefined>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [priceOpened, setPriceOpened] = useState<boolean>(false)
  const [sizeOpened, setSizeOpened] = useState<boolean>(false)

  const scrollUp = () => {
    document.getElementById('list')?.scroll({ top: 0 });
  }

  const onPaginationChange = useDebouncedCallback((page: number, pageSize: number) => {
    setPageNumber(page)
    setPageSize(pageSize)
    scrollUp()
  }, 1000)

  const onSearch = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPageNumber(1)
    scrollUp()
  }, 1000)

  const onPrice = (data: {minPrice: string, maxPrice: string}) => {
    setMinPrice(data.minPrice)
    setMaxPrice(data.maxPrice)
    setPageNumber(1)
    scrollUp()
  }

  const onSize = (data: {minSize: string, maxSize: string}) => {
    setMinSize(data.minSize)
    setMaxSize(data.maxSize)
    setPageNumber(1)
    scrollUp()
  }

  // Calculate the match score as a number between 0 and 1
  const searchWords = search.length > 0 ? search.toLowerCase().split(' ') : []

  const homes = useLiveQuery(() => {

    const query = db.homes.toCollection()

    if (minSize) {
      // Apply minimum size filter
      query.and(home => home.m2 >= parseInt(minSize, 10));
    }
  
    if (maxSize) {
      // Apply maximum size filter
      query.and(home => home.m2 <= parseInt(maxSize, 10));
    }
  
    if (minPrice) {
      // Apply minimum price filter
      query.and(home => home.price >= parseInt(minPrice, 10));
    }
  
    if (maxPrice) {
      // Apply maximum price filter
      query.and(home => home.price <= parseInt(maxPrice, 10));
    }

    return query.toArray()

  }, [minSize, maxSize, minPrice, maxPrice, search])

  // filter by keywords 
  const homesMatchingSearch = searchWords.length ? 
    homes?.filter(home => searchWords.some(word => home.comment.includes(` ${word} `))) : 
    homes

  // add match index to homes
  const homesWithMatch: HomeWithMatch[] | undefined = homesMatchingSearch?.map(home => ({
    ...home, 
    match: searchWords.filter(word => home.comment.includes(word)).length / searchWords.length,
  }))

  // sorting
  const sortedHomes = homesWithMatch?.sort((a, b) => b.match - a.match);

  // Calculate the start and end indexes for the current page
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Extract the slice of data for the current page
  const paginatedHomes = sortedHomes ? sortedHomes.slice(startIndex, endIndex) : undefined;

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Filters}>
        <Input 
          prefix={<SearchOutlined />}
          placeholder="Scrivi parole, per esempio 'travi vista' oppure 'signorile'"
          onChange={onSearch}
        />
        <Dropdown 
          placement="bottom" 
          trigger={["click"]}
          open={priceOpened}
          onOpenChange={setPriceOpened}
          dropdownRender={() => (
          <Form
            layout="horizontal"
            onFinish={onPrice}
            className={style.Dropdown}
            initialValues={{
              minPrice,
              maxPrice,
            }}
          >
            <Form.Item
              label="Da"
              name="minPrice"
            >
              <InputNumber
                addonAfter="€"
                style={{width: '100%'}}
                controls={false}
                placeholder='Min. Price'
                formatter={value => value ? NumberFormatter.format(value) : ''}
                parser={(value?: string) => value ? stringToNumber(value) : ''}
              />
            </Form.Item>
            <Form.Item
              label="A"
              name="maxPrice"
            >
              <InputNumber
                addonAfter="€"
                style={{width: '100%'}}
                controls={false}
                placeholder='Max. Price'
                formatter={value => value ? NumberFormatter.format(value) : ''}
                parser={(value?: string) => value ? stringToNumber(value) : ''}
              />
            </Form.Item>
            <Button 
              htmlType='submit' 
              onClick={() => setPriceOpened(false)}>
                Vedi Annunci
            </Button>
          </Form>
        )}>
          <Button 
            onClick={() => setPriceOpened(!priceOpened)}
          >
            Prezzo
            <DownOutlined />
          </Button>
        </Dropdown>
        <Dropdown 
          placement="bottom" 
          trigger={["click"]}
          open={sizeOpened}
          onOpenChange={setSizeOpened}
          dropdownRender={() => (
          <Form
            layout="horizontal"
            onFinish={onSize}
            className={style.Dropdown}
            initialValues={{
              minSize,
              maxSize,
            }}
          >
            <Form.Item
              label="Da"
              name="minSize"
            >
              <InputNumber
                addonAfter="m&sup2;"
                style={{width: '100%'}}
                controls={false}
                placeholder='Min. Size'
                formatter={value => value ? NumberFormatter.format(value) : ''}
                parser={(value?: string) => value ? stringToNumber(value) : ''}
              />
            </Form.Item>
            <Form.Item
              label="A"
              name="maxSize"
            >
              <InputNumber
                addonAfter="m&sup2;"
                style={{width: '100%'}}
                controls={false}
                placeholder='Max. Size'
                formatter={value => value ? NumberFormatter.format(value) : ''}
                parser={(value?: string) => value ? stringToNumber(value) : ''}
              />
            </Form.Item>
            <Button 
              htmlType='submit' 
              onClick={() => setSizeOpened(false)}>
                Vedi Annunci
            </Button>
          </Form>
        )}>
          <Button 
            onClick={() => setSizeOpened(!sizeOpened)}
          >
            m&sup2;
            <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      {
        sortedHomes &&
          <div className={style.BelowFilter}> 
            <span className={style.ResultCounter}>
              {sortedHomes.length} Risultati |
            </span>
            <Link className={style.NewRequestLink} to="/request">
              Richiedi un'altra cittá
            </Link>
          </div>
      }
      <div id="list" className={style.ListContainer}>
        { 
          paginatedHomes !== undefined ?
            paginatedHomes.length === 0 ? 
              <Icon className={style.NoData} component={NoData}/> :
              <div className={style.List}>
                { paginatedHomes.map((home) => (
                  <HomeElement 
                    key={home.uuid} 
                    home={home} 
                    onPreview={onPreview}
                  />
                ))}
              </div> :
            <Spin size='large'/>
        }
      </div>
      {
        sortedHomes &&
        <div className={style.Pagination}>
          <Pagination 
            defaultCurrent={pageNumber}
            defaultPageSize={pageSize}
            current={pageNumber}
            total={sortedHomes.length} 
            onChange={onPaginationChange}
          />
        </div>
      }
    </div>
  );
};

export { HomesList };