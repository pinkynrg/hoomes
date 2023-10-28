import style from './HomesList.module.scss';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce'
import { Button, Dropdown, Form, Input, InputNumber, Pagination } from 'antd';
import { HomeElement } from '../HomeElement/HomeElement';
import { Home } from '../../types';
import Icon, { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { NumberFormatter, stringToNumber } from '../../utils';
import { NoData } from '../Icons/NoData';
import classnames from 'classnames';
import { Link } from 'react-router-dom';

interface HomesListProps {
  homes: Home[]
  onPreview: (url: string) => void
  className: string
}

const HomesList = ({ 
  homes,
  onPreview,
  className,
}: HomesListProps) => {
  const [search, setSearch] = useState('')
  const [minSize, setMinSize] = useState<string | undefined>()
  const [maxSize, setMaxSize] = useState<string | undefined>()
  const [minPrice, setMinPrice] = useState<string | undefined>()
  const [maxPrice, setMaxPrice] = useState<string | undefined>()
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(100)
  const [priceOpened, setPriceOpened] = useState<boolean>(false)
  const [sizeOpened, setSizeOpened] = useState<boolean>(false)

  const onPaginationChange = useDebouncedCallback((page: number, pageSize: number) => {
    setPage(page)
    setPageSize(pageSize)
  }, 1000)

  const onSearch = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, 1000)

  const onPrice = (data: {minPrice: string, maxPrice: string}) => {
    setMinPrice(data.minPrice)
    setMaxPrice(data.maxPrice)
  }

  const onSize = (data: {minSize: string, maxSize: string}) => {
    setMinSize(data.minSize)
    setMaxSize(data.maxSize)
  }

  const filteredHomes = homes.map((home) => {
    
    // Calculate the match score as a number between 0 and 1
    const searchWords = search.length > 0 ? search.toLowerCase().split(' ') : []

    const match = searchWords.length > 0 ? 
      searchWords.filter(word => home.comment.includes(word)).length / searchWords.length :
      1

    if (match === 0 && searchWords.length > 0) {
      return null;
    }
  
    // Filter by minimum and maximum size (if set)
    if (minSize && home.m2 < parseInt(minSize, 10)) {
      return null; // Filter out the house
    }
    if (maxSize && home.m2 > parseInt(maxSize, 10)) {
      return null; // Filter out the house
    }
  
    // Filter by minimum and maximum price (if set)
    if (minPrice && home.price < parseInt(minPrice, 10)) {
      return null; // Filter out the house
    }
    if (maxPrice && home.price > parseInt(maxPrice, 10)) {
      return null; // Filter out the house
    }
  
    // If all conditions pass, include this home in the result with the match score
    return { ...home, match };
  }).filter((e): e is Home => e !== null); // Remove null entries

  const sortedHomes = filteredHomes.sort((a, b) => b.match - a.match);

  // Calculate the start and end indexes for the current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Extract the slice of data for the current page
  const paginatedData = sortedHomes.slice(startIndex, endIndex);

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Filters}>
        <Input 
          addonAfter={<SearchOutlined />}
          placeholder='search stuff'
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
      <div className={style.BelowFilter}> 
        <span className={style.ResultCounter}>
          {filteredHomes.length} Risultati
        </span>
        <Link to="/request">
          Request another city
        </Link>
      </div>
      <div className={style.ListContainer}>
        { 
          paginatedData.length === 0 ?
            <Icon className={style.NoData} component={NoData}/> :
            <div className={style.List}>
              {
                paginatedData.map((home) => (
                  <HomeElement key={home.uuid} home={home} onPreview={onPreview}/>
                ))
              }
            </div>
        }
      </div>
      <div className={style.Pagination}>
        <Pagination 
          defaultCurrent={page} 
          total={filteredHomes.length} 
          onChange={onPaginationChange}
        />
      </div>
    </div>
  );
};

export { HomesList };