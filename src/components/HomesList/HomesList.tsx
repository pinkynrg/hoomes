import style from './HomesList.module.scss';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce'
import { Input } from 'antd';
import { HomeElement } from '../HomeElement/HomeElement';
import { useLocalStorage } from 'usehooks-ts';
import { Home } from '../../types';

interface HomesListProps {
  onPreview: (url: string) => void
}

const HomesList = ({ onPreview }: HomesListProps) => {
  const [data, setData] = useLocalStorage<Home[]>('data', [])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<string | undefined>('')
  const [province, setProvince] = useState<string | undefined>('')
  const [location, setLocation] = useState<string | undefined>('')
  const [minSize, setMinSize] = useState<string | undefined>('')
  const [maxSize, setMaxSize] = useState<string | undefined>('')
  const [minPrice, setMinPrice] = useState<string | undefined>('')
  const [maxPrice, setMaxPrice] = useState<string | undefined>('')
  const page = 1;
  const page_size = 100;

  const onSearch = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, 1000)

  const onChangeProvince = useDebouncedCallback((value: string) => {
    setProvince(value)
  }, 1000)

  const onMinPrice = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPrice(e.target.value)
  }, 1000)

  const onMaxPrice = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value)
  }, 1000)

    return (
      <div className={style.Container}>
        <div className={style.Filters}>
          <Input 
            placeholder='search stuff'
            onChange={onSearch}
          />
          <Input 
            placeholder='min price'
            onChange={onMinPrice}
          />
          <Input 
            placeholder='max price'
            onChange={onMaxPrice}
          />
        </div>
        <div className={style.List}>
            {data.map((home) => (
              <HomeElement key={home.uuid} home={home} onPreview={onPreview}/>
            ))}
        </div>
      </div>
    );
};

export { HomesList };