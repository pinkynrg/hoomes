import React, { useCallback, useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Button, Dropdown, Input, Pagination, Popconfirm, Select, Spin } from 'antd'
import Icon, {
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
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
import { Sorting } from '../Icons/Sorting'
import { SortDropdown, SORT_OPTIONS } from './Dropdowns/SortDropdown'
import { compactEuro } from '../../utils'

interface HomesListProps {
  onPreview: (url: string) => void
  className: string
}

const rangeLabel = (
  fallback: string,
  format: (value: number) => string,
  min?: string,
  max?: string,
) => {
  const from = min ? format(parseInt(min, 10)) : undefined
  const to = max ? format(parseInt(max, 10)) : undefined
  if (from && to) return `${from} – ${to}`
  if (from) return `da ${from}`
  if (to) return `fino a ${to}`
  return fallback
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
  const [sortBy, setSortBy] = useState<string>('match-desc')
  const [priceOpened, setPriceOpened] = useState<boolean>(false)
  const [sizeOpened, setSizeOpened] = useState<boolean>(false)
  const [sortOpened, setSortOpened] = useState<boolean>(false)

  const scrollUp = () => {
    document.getElementById('list')?.scroll({ top: 0, behavior: 'smooth' })
  }

  const onLocationsChange = useDebouncedCallback((cities: string[]) => {
    setLocations(cities)
    setPageNumber(1)
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
  }, 500)

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

  const onSort = useCallback((newSortBy: string) => {
    setSortBy(newSortBy)
    scrollUp()
    setSortOpened(false)
  }, [])

  const resetFilters = useCallback(() => {
    setLocations([])
    setMinPrice(undefined)
    setMaxPrice(undefined)
    setMinSize(undefined)
    setMaxSize(undefined)
    setPageNumber(1)
  }, [])

  // Calculate the match score as a number between 0 and 1
  const searchWords = search.length > 0 ? search.toLowerCase().split(' ') : []

  const allHomes = useLiveQuery(() => db.homes.toArray())

  const cityOptions = useMemo(() => {
    const homesInDb = allHomes || []
    const provinces = homesInDb
      .filter((home) => home.province)
      .map((home) => home.province)
      .filter((province, index, array) => array.indexOf(province) === index)
      .sort((a, b) => a.localeCompare(b))

    return provinces.map((province) => ({
      label: province,
      options: homesInDb
        .filter((home) => home.province === province)
        .map((home) => home.city)
        .filter((city, index, array) => array.indexOf(city) === index)
        .sort((a, b) => a.localeCompare(b))
        .map((city) => ({ label: city, value: city })),
    }))
  }, [allHomes])

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
      // Apply city filter
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
    match: searchWords.length
      ? searchWords.filter((word) => home.comment.includes(word)).length / searchWords.length
      : 1,
  }))

  const getSortingFunction = (key: string) => {
    switch (key) {
      case 'match-desc': return (a: HomeWithMatch, b: HomeWithMatch) => b.match - a.match
      case 'price-asc': return (a: HomeWithMatch, b: HomeWithMatch) => a.price - b.price
      case 'price-desc': return (a: HomeWithMatch, b: HomeWithMatch) => b.price - a.price
      case 'm2-desc': return (a: HomeWithMatch, b: HomeWithMatch) => b.m2 - a.m2
      case 'm2-asc': return (a: HomeWithMatch, b: HomeWithMatch) => a.m2 - b.m2
      case 'price_per_meter-asc': return (a: HomeWithMatch, b: HomeWithMatch) => (a.price / a.m2) - (b.price / b.m2)
      default: return (a: HomeWithMatch, b: HomeWithMatch) => b.match - a.match
    }
  }

  // sorting
  const sortedHomes = homesWithMatch?.sort(getSortingFunction(sortBy))

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

  const getSortDropdown = useCallback(() => (
    <SortDropdown
      sortBy={sortBy}
      onSubmit={onSort}
    />
  ), [sortBy, onSort])

  const priceActive = !!(minPrice || maxPrice)
  const sizeActive = !!(minSize || maxSize)
  const filtersActive = priceActive || sizeActive || locations.length > 0
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Ordina'

  const renderList = () => {
    if (paginatedHomes === undefined) {
      return (
        <div className={style.Centered}>
          <Spin size="large" />
        </div>
      )
    }

    if (paginatedHomes.length === 0) {
      return (
        <div className={style.Centered}>
          <Icon className={style.NoData} component={NoData} />
          <p className={style.NoDataTitle}>Nessuna casa trovata</p>
          <p className={style.NoDataText}>
            Prova con parole diverse o allarga i filtri di prezzo e superficie.
          </p>
          { filtersActive && (
            <Button onClick={resetFilters}>Azzera i filtri</Button>
          )}
        </div>
      )
    }

    return (
      <div className={style.List}>
        { paginatedHomes.map((home) => (
          <HomeElement
            key={home.uuid}
            home={home}
            onPreview={onPreview}
            showMatch={searchWords.length > 0}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={classnames(style.Container, className)}>
      <div className={style.Filters}>
        <Input
          className={style.Search}
          prefix={<SearchOutlined className={style.SearchIcon} />}
          placeholder="Cerca nelle descrizioni: giardino, terrazzo, vista…"
          allowClear
          onChange={onSearch}
        />
        <div className={style.FilterRow}>
          <Select
            className={classnames(style.CitySelect, {
              [style.Active]: locations.length > 0,
            })}
            mode="multiple"
            allowClear
            showSearch
            maxTagCount={1}
            options={cityOptions}
            value={locations}
            onChange={onLocationsChange}
            placeholder="Tutte le città"
            optionFilterProp="label"
            disabled={cityOptions.length === 0}
          />
          <Dropdown
            placement="bottomLeft"
            trigger={['click']}
            open={priceOpened}
            onOpenChange={setPriceOpened}
            dropdownRender={getPriceFilterDropdown}
          >
            <Button className={classnames(style.FilterButton, { [style.Active]: priceActive })}>
              {rangeLabel('Prezzo', compactEuro, minPrice, maxPrice)}
              <DownOutlined className={style.Caret} />
            </Button>
          </Dropdown>
          <Dropdown
            placement="bottomLeft"
            trigger={['click']}
            open={sizeOpened}
            onOpenChange={setSizeOpened}
            dropdownRender={getSizeFilterDropdown}
          >
            <Button className={classnames(style.FilterButton, { [style.Active]: sizeActive })}>
              {rangeLabel('Superficie', (value) => `${value} m²`, minSize, maxSize)}
              <DownOutlined className={style.Caret} />
            </Button>
          </Dropdown>
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            open={sortOpened}
            onOpenChange={setSortOpened}
            dropdownRender={getSortDropdown}
          >
            <Button className={style.FilterButton}>
              <Icon component={Sorting} />
              <span className={style.SortLabel}>{sortLabel}</span>
            </Button>
          </Dropdown>
          { filtersActive && (
            <Button type="text" className={style.Reset} onClick={resetFilters}>
              Azzera
            </Button>
          )}
        </div>
      </div>

      { sortedHomes && (
        <div className={style.Toolbar}>
          <span className={style.ResultCounter}>
            <strong>{sortedHomes.length}</strong>
            { sortedHomes.length === 1 ? ' casa' : ' case' }
            { searchWords.length > 0 && ' per la tua ricerca' }
          </span>
          <span className={style.ToolbarActions}>
            <Link className={style.NewRequestLink} to="/request">
              <PlusOutlined />
              Altri comuni
            </Link>
            <Popconfirm
              title="Svuotare i dati locali?"
              description="Gli annunci salvati nel browser verranno eliminati."
              okText="Svuota"
              cancelText="Annulla"
              okButtonProps={{ danger: true }}
              onConfirm={() => db.homes.clear()}
            >
              <span className={style.EmptyDB}>Svuota dati locali</span>
            </Popconfirm>
          </span>
        </div>
      )}

      <div id="list" className={style.ListContainer}>
        {renderList()}
      </div>

      { sortedHomes && sortedHomes.length > 0 && (
        <div className={style.Pagination}>
          <Pagination
            size="small"
            current={pageNumber}
            pageSize={pageSize}
            total={sortedHomes.length}
            showSizeChanger={false}
            onChange={onPaginationChange}
          />
        </div>
      )}
    </div>
  )
}

export { HomesList }
