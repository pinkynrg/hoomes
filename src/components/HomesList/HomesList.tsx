import { useQuery } from 'react-query';
import { Home } from '../../types';
import style from './HomesList.module.scss';
import { useEffect, useState } from 'react';
import { percentage } from '../../utils';
import classnames from 'classnames'
import { useDebouncedCallback } from 'use-debounce'
import { Input, Select } from 'antd';
import axios from 'axios';

const HomesList = () => {
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

  const onChangeRegion = useDebouncedCallback((value: string) => {
    setRegion(value)
  }, 1000)

  const onChangeProvince = useDebouncedCallback((value: string) => {
    setProvince(value)
  }, 1000)

  const onChangeLocation = useDebouncedCallback((value: string) => {
    setLocation(value)
  }, 1000)
  
  const onMinPrice = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPrice(e.target.value)
  }, 1000)

  const onMaxPrice = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value)
  }, 1000)

  const onMinSize = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinSize(e.target.value)
  }, 1000)

  const onMaxSize = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxSize(e.target.value)
  }, 1000)

  const fetchHouses = async () => {
    try {
      const params = {
        page,
        page_size,
        search,
        region,
        province,
        location,
        min_price: minPrice,
        max_price: maxPrice,
        min_size: minSize,
        max_size: maxSize,
      }
      const response = await axios.get('/v1/houses', { params });
      return response.data;
    } catch {
      throw new Error('Network response was not ok');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/v1/regions');
      return response.data;
    }
    catch {
      throw new Error('Network response was not ok');
    }
  };

  const fetchProvinces = async () => {
    try {
      const params = {
        region
      }
      const response = await axios.get('/v1/provinces', { params });
      return response.data;
    }
    catch {
      throw new Error('Network response was not ok');
    }
  };

  const fetchLocations = async () => {
    const params = {
      region,
      province,
    }
    try {
      const response = await axios.get('/v1/locations', { params });
      return response.data
    }
    catch {
      throw new Error('Network response was not ok');
    }
  };

  const { 
    data: houses, 
    isLoading: housesAreLoading, 
    isFetching: housesAreFetching, 
    isError: housesErrored,
    refetch: refetchHouses,
  } = useQuery<Home[]>('houses', fetchHouses);

  const { 
    data: regions, 
    isLoading: regionsAreLoading, 
    isError: regionsErrored 
  } = useQuery<string[]>('regions', fetchRegions);

  const { 
    data: provinces, 
    isLoading: provincesAreLoading, 
    isError: provincesErrored,
    refetch: refetchProvinces,
  } = useQuery<string[]>('provinces', fetchProvinces);


  const { 
    data: locations, 
    isLoading: locationsAreLoading, 
    isError: locationsErrored,
    refetch: refetchLocations,
  } = useQuery<string[]>('locations', fetchLocations);

  useEffect(() => {
    refetchHouses()
  }, [refetchHouses, search, minPrice, maxPrice, minSize, maxSize, region, province, location]) 

  useEffect(() => {
    refetchLocations()
  }, [region, province, refetchLocations])

  useEffect(() => {
    refetchProvinces()
  }, [region, refetchProvinces])

  if (housesAreLoading) {
    return <div>Loading...</div>;
  }

  if (housesErrored || locationsErrored || regionsErrored || provincesErrored) {
    return <div>Error fetching data</div>;
  }

  if (houses && regions && provinces && locations) {
    return (
      <div className={style.Container}>
        <div className={style.Filters}>
          <Input 
            placeholder='search stuff'
            disabled={housesAreFetching}
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
          <Input 
            placeholder='min size'
            onChange={onMinSize}
          />
          <Input 
            placeholder='max size'
            onChange={onMaxSize}
          />
          <Select
            allowClear
            placeholder={`select region [${regions.length}]`}
            disabled={regionsAreLoading}
            onChange={onChangeRegion}
            options={regions.map((region) => ({value: region, label: region}))}
            showSearch
            filterOption={(input, option) => (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())}
          />
          <Select
            allowClear
            placeholder={`select province [${provinces.length}]`}
            disabled={provincesAreLoading}
            onChange={onChangeProvince}
            options={provinces.map((province) => ({value: province, label: province}))}
            showSearch
            filterOption={(input, option) => (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())}
          />
          <Select
            allowClear
            placeholder={`select location [${locations.length}]`}
            disabled={locationsAreLoading}
            onChange={onChangeLocation}
            options={locations.map((location) => ({value: location, label: location}))}
            showSearch
            filterOption={(input, option) => (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())}
          />
        </div>
        <div className={style.List}>
            {houses.map((house) => (
              <div className={style.Row} key={house.uuid}>
                <span className={style.Image}> <img src={house.image} alt="main_image"/> </span>
                <span className={classnames(style.Match, style.Text)}> {percentage(house.match)} </span>
                <span className={classnames(style.Title, style.Text)}> <a href={house.url} target="_blank" rel="noreferrer"> {house.title} </a> </span>
                <span className={classnames(style.Location, style.Text)}> {house.region} </span>
                <span className={classnames(style.Location, style.Text)}> {house.province} </span>
                <span className={classnames(style.Location, style.Text)}> {house.location} </span>
                <span className={classnames(style.Price, style.Text)}> {house.price} Euro </span>
                <span className={classnames(style.M2, style.Text)}> {house.m2} m2</span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
};

export { HomesList };