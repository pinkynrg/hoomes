import React, { useCallback, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Button, Dropdown, Input, Pagination, Spin, TreeSelect } from 'antd'
import Icon, { SearchOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { HomeElement } from '../HomeElement/HomeElement'
import { NoData } from '../Icons/NoData'
import { db } from '../../dbConfig'
import { HomeWithMatch } from '../../types'
import style from './HomesList.module.scss'
import { PriceFilterDropdown } from './Dropdowns/PriceFilterDropdown'
import { SizeFilterDropdown } from './Dropdowns/SizeFilterDropdown'

interface HomesListProps {
  onPreview: (url: string) => void
  className: string
}

const HomesList = ({
  onPreview,
  className,
}: HomesListProps) => {
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [minSize, setMinSize] = useState<string | undefined>()
  const [maxSize, setMaxSize] = useState<string | undefined>()
  const [minPrice, setMinPrice] = useState<string | undefined>()
  const [maxPrice, setMaxPrice] = useState<string | undefined>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [priceOpened, setPriceOpened] = useState<boolean>(false)
  const [sizeOpened, setSizeOpened] = useState<boolean>(false)

  const scrollUp = () => {
    document.getElementById('list')?.scroll({ top: 0 })
  }

  const onLocationsChange = useDebouncedCallback((cities: string[]) => {
    setLocations(cities)
  })

  const onPaginationChange = useDebouncedCallback((newPage: number, newPageSize: number) => {
    setPageNumber(newPage)
    setPageSize(newPageSize)
    scrollUp()
  }, 1000)

  const onSearch = useDebouncedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPageNumber(1)
    scrollUp()
  }, 1000)

  const onPrice = useCallback((data: {minPrice: string, maxPrice: string}) => {
    setMinPrice(data.minPrice)
    setMaxPrice(data.maxPrice)
    setPageNumber(1)
    scrollUp()
    setPriceOpened(false)
  }, [])

  const onSize = useCallback((data: {minSize: string, maxSize: string}) => {
    setMinSize(data.minSize)
    setMaxSize(data.maxSize)
    setPageNumber(1)
    scrollUp()
    setSizeOpened(false)
  }, [])

  // Calculate the match score as a number between 0 and 1
  const searchWords = search.length > 0 ? search.toLowerCase().split(' ') : []

  const allHomes = useLiveQuery(() => db.homes.toArray()) || []

  const citiesTree = allHomes
    .filter((home) => home.province)
    .map((home) => home.province)
    .filter((home, index, array) => array.indexOf(home) === index)
    .map((province) => ({
      value: `${province}!`,
      title: province,
      children: allHomes
        .filter((home) => home.province === province)
        .map((home) => home.city)
        .filter((city, index, array) => array.indexOf(city) === index)
        .map((city) => ({
          value: city,
          title: city,
        })),
    }))

  const homes = useLiveQuery(() => {
    const query = db.homes.toCollection()

    if (minSize) {
      // Apply minimum size filter
      query.and((home) => home.m2 >= parseInt(minSize, 10))
    }

    if (maxSize) {
      // Apply maximum size filter
      query.and((home) => home.m2 <= parseInt(maxSize, 10))
    }

    if (minPrice) {
      // Apply minimum price filter
      query.and((home) => home.price >= parseInt(minPrice, 10))
    }

    if (maxPrice) {
      // Apply maximum price filter
      query.and((home) => home.price <= parseInt(maxPrice, 10))
    }

    if (locations.length > 0) {
      // Apply maximum price filter
      query.and((home) => locations.includes(home.city))
    }

    return query.toArray()
  }, [minSize, maxSize, minPrice, maxPrice, search, locations])

  // filter by keywords
  const homesMatchingSearch = searchWords.length
    ? homes?.filter((home) => searchWords.some((word) => home.comment.includes(` ${word} `)))
    : homes

  // add match index to homes
  const homesWithMatch: HomeWithMatch[] | undefined = homesMatchingSearch?.map((home) => ({
    ...home,
    match: searchWords.filter((word) => home.comment.includes(word)).length / searchWords.length,
  }))

  // sorting
  const sortedHomes = homesWithMatch?.sort((a, b) => b.match - a.match)

  // Calculate the start and end indexes for the current page
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Extract the slice of data for the current page
  const paginatedHomes = sortedHomes ? sortedHomes.slice(startIndex, endIndex) : undefined

  const getPriceFilterDropdown = useCallback(() => (
    <PriceFilterDropdown
      minPrice={minPrice}
      maxPrice={maxPrice}
      onSubmit={onPrice}
    />
  ), [maxPrice, minPrice, onPrice])

  const getSizeFilterDropdown = useCallback(() => (
    <SizeFilterDropdown
      minSize={minSize}
      maxSize={maxSize}
      onSubmit={onSize}
    />
  ), [maxSize, minSize, onSize])

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Filters}>
        <TreeSelect
          allowClear
          showSearch
          multiple
          treeCheckable
          style={{ minWidth: '150px' }}
          dropdownStyle={{ width: '250px' }}
          filterTreeNode={(inputValue, treeNode) => {
            const toLower = inputValue.toLowerCase()
            const nodeValue = treeNode.title?.toString() || ''
            return nodeValue.toLowerCase().includes(toLower)
          }}
          maxTagCount={0}
          autoClearSearchValue={false}
          showCheckedStrategy="SHOW_CHILD"
          onChange={onLocationsChange}
          placeholder="Seleziona una cittá"
          treeData={citiesTree}
          disabled={citiesTree.length === 0}
        />
        <Input
          prefix={<SearchOutlined />}
          placeholder="Scrivi parole, per esempio 'travi vista' oppure 'signorile'"
          onChange={onSearch}
        />
        <Dropdown
          placement="bottom"
          trigger={['click']}
          open={priceOpened}
          onOpenChange={setPriceOpened}
          dropdownRender={getPriceFilterDropdown}
        >
          <Button onClick={() => setPriceOpened(!priceOpened)}> € </Button>
        </Dropdown>
        <Dropdown
          placement="bottom"
          trigger={['click']}
          open={sizeOpened}
          onOpenChange={setSizeOpened}
          dropdownRender={getSizeFilterDropdown}
        >
          <Button onClick={() => setSizeOpened(!sizeOpened)}>m&sup2;</Button>
        </Dropdown>
      </div>
      {
        sortedHomes
          && (
          <div className={style.BelowFilter}>
            <span className={style.ResultCounter}>
              {sortedHomes.length}
              {' '}
              Risultati |
            </span>
            <Link className={style.NewRequestLink} to="/request">
              Richiedi altre cittá
            </Link>
          </div>
          )
      }
      <div id="list" className={style.ListContainer}>
        {
          // eslint-disable-next-line no-nested-ternary
          paginatedHomes !== undefined
            ? paginatedHomes.length === 0
              ? <Icon className={style.NoData} component={NoData} />
              : (
                <div className={style.List}>
                  { paginatedHomes.map((home) => (
                    <HomeElement
                      key={home.uuid}
                      home={home}
                      onPreview={onPreview}
                    />
                  ))}
                </div>
              )
            : <Spin size="large" />
        }
      </div>
      {
        sortedHomes
        && (
        <div className={style.Pagination}>
          <Pagination
            defaultCurrent={pageNumber}
            defaultPageSize={pageSize}
            current={pageNumber}
            total={sortedHomes.length}
            onChange={onPaginationChange}
          />
        </div>
        )
      }
    </div>
  )
}

export { HomesList }
