import { KeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { CloseOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import { useOnClickOutside } from 'usehooks-ts'
import { Location } from '../../types'
import { NumberFormatter } from '../../utils'
import style from './CityPicker.module.scss'

const MAX_SUGGESTIONS = 7
const MAX_PROVINCE_SUGGESTIONS = 2
const QUICK_PICKS = 6

interface CityEntry {
  code: string
  name: string
  search: string
  province: string
  sigla: string
  region: string
  population: number
}

interface ProvinceEntry {
  name: string
  search: string
  sigla: string
  region: string
  codes: string[]
  population: number
}

type Suggestion =
  | { kind: 'city', key: string, city: CityEntry }
  | { kind: 'province', key: string, province: ProvinceEntry }

interface CityPickerProps {
  locations: Location[]
  value: string[]
  onChange: (codes: string[]) => void
  max: number
  loading?: boolean
  className?: string
}

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/['’]/g, ' ')

const rankOf = (search: string, at: number) => {
  if (at === 0) return 0
  if (search[at - 1] === ' ') return 1
  return 2
}

/* Highlights the matched slice of a name without breaking its accents. */
const highlight = (text: string, query: string): ReactNode => {
  const at = query ? normalize(text).indexOf(query) : -1
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  )
}

const CityPicker = ({
  locations,
  value,
  onChange,
  max,
  loading = false,
  className,
}: CityPickerProps) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useOnClickOutside(containerRef, () => setOpen(false))

  const cities = useMemo<CityEntry[]>(() => locations.map((location) => ({
    code: location.codice,
    name: location.nome,
    search: normalize(location.nome),
    province: location.provincia_nome,
    sigla: location.sigla,
    region: location.regione_nome,
    population: location.popolazione || 0,
  })), [locations])

  const citiesByCode = useMemo(
    () => new Map(cities.map((city) => [city.code, city])),
    [cities],
  )

  const provinces = useMemo<ProvinceEntry[]>(() => {
    const grouped = new Map<string, ProvinceEntry>()
    cities.forEach((city) => {
      const existing = grouped.get(city.province)
      if (existing) {
        existing.codes.push(city.code)
        existing.population += city.population
      } else {
        grouped.set(city.province, {
          name: city.province,
          search: normalize(city.province),
          sigla: city.sigla,
          region: city.region,
          codes: [city.code],
          population: city.population,
        })
      }
    })
    return Array.from(grouped.values())
  }, [cities])

  const quickPicks = useMemo(
    () => [...cities].sort((a, b) => b.population - a.population).slice(0, QUICK_PICKS),
    [cities],
  )

  const normalizedQuery = normalize(query.trim())

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!normalizedQuery) return []

    const selected = new Set(value)

    const cityHits = cities
      .map((city) => ({ city, at: city.search.indexOf(normalizedQuery) }))
      .filter(({ city, at }) => at >= 0 && !selected.has(city.code))
      .sort((a, b) => (
        rankOf(a.city.search, a.at) - rankOf(b.city.search, b.at)
        || b.city.population - a.city.population
      ))
      .slice(0, MAX_SUGGESTIONS)
      .map(({ city }): Suggestion => ({ kind: 'city', key: city.code, city }))

    const provinceHits = provinces
      .map((province) => ({ province, at: province.search.indexOf(normalizedQuery) }))
      .filter(({ province, at }) => (
        at >= 0 && province.codes.some((code) => !selected.has(code))
      ))
      .sort((a, b) => (
        rankOf(a.province.search, a.at) - rankOf(b.province.search, b.at)
        || b.province.population - a.province.population
      ))
      .slice(0, MAX_PROVINCE_SUGGESTIONS)
      .map(({ province }): Suggestion => ({
        kind: 'province',
        key: `provincia-${province.name}`,
        province,
      }))

    return [...cityHits, ...provinceHits]
  }, [cities, provinces, normalizedQuery, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [normalizedQuery])

  useEffect(() => {
    const active = listRef.current?.children[activeIndex] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, suggestions])

  const commit = useCallback((codes: string[], label: string) => {
    const merged = codes.filter((code) => !value.includes(code))
    if (merged.length === 0) return

    const room = max - value.length
    if (room <= 0) {
      setNotice(`Puoi cercare al massimo ${max} comuni per volta.`)
      return
    }

    if (merged.length > room) {
      onChange([...value, ...merged.slice(0, room)])
      setNotice(`Aggiunti solo ${room} comuni di ${label}: il limite è ${max}.`)
      return
    }

    onChange([...value, ...merged])
    setNotice(null)
  }, [max, onChange, value])

  const select = useCallback((suggestion: Suggestion) => {
    if (suggestion.kind === 'city') {
      commit([suggestion.city.code], suggestion.city.name)
    } else {
      commit(suggestion.province.codes, `provincia di ${suggestion.province.name}`)
    }
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }, [commit])

  const remove = useCallback((code: string) => {
    onChange(value.filter((selected) => selected !== code))
    setNotice(null)
  }, [onChange, value])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (suggestions.length === 0) return
      setOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (
        (current + direction + suggestions.length) % suggestions.length
      ))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const suggestion = suggestions[activeIndex]
      if (suggestion) select(suggestion)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (event.key === 'Backspace' && query === '' && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  const selectedCities = value
    .map((code) => citiesByCode.get(code))
    .filter((city): city is CityEntry => !!city)

  const visibleQuickPicks = quickPicks.filter((city) => !value.includes(city.code))
  const showDropdown = open && normalizedQuery.length > 0

  return (
    <div className={classnames(style.CityPicker, className)} ref={containerRef}>
      <div className={style.FieldWrap}>
        <div
          className={classnames(style.Field, { [style.Disabled]: loading })}
          onClick={() => inputRef.current?.focus()}
        >
          <SearchOutlined className={style.SearchIcon} />
          <div className={style.Tokens}>
            { selectedCities.map((city) => (
              <span key={city.code} className={style.Chip}>
                <span className={style.ChipName}>{city.name}</span>
                <span className={style.ChipMeta}>{city.sigla}</span>
                <button
                  type="button"
                  className={style.ChipRemove}
                  aria-label={`Rimuovi ${city.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(city.code)
                  }}
                >
                  <CloseOutlined />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              className={style.Input}
              value={query}
              disabled={loading}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={
                // eslint-disable-next-line no-nested-ternary
                loading
                  ? 'Carico i comuni italiani…'
                  : (selectedCities.length ? 'Aggiungi un altro comune…' : 'Cerca un comune o una provincia…')
              }
              aria-label="Cerca un comune o una provincia"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
              role="combobox"
              aria-controls="city-picker-list"
            />
          </div>
          { selectedCities.length > 0 && (
            <button
              type="button"
              className={style.ClearAll}
              onClick={(event) => {
                event.stopPropagation()
                onChange([])
                setNotice(null)
              }}
            >
              Svuota
            </button>
          )}
        </div>

        { showDropdown && (
          <div className={style.Dropdown}>
            { suggestions.length === 0
              ? (
                <div className={style.NoResults}>
                  {`Nessun comune trovato per “${query.trim()}”`}
                </div>
              )
              : (
                <ul className={style.Results} id="city-picker-list" role="listbox" ref={listRef}>
                  { suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.key}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={classnames(style.Result, {
                        [style.Active]: index === activeIndex,
                        [style.ProvinceResult]: suggestion.kind === 'province',
                      })}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(suggestion)}
                    >
                      <EnvironmentOutlined className={style.ResultIcon} />
                      { suggestion.kind === 'city'
                        ? (
                          <>
                            <span className={style.ResultName}>
                              {highlight(suggestion.city.name, normalizedQuery)}
                            </span>
                            <span className={style.ResultMeta}>
                              {suggestion.city.province}
                              {' · '}
                              {suggestion.city.region}
                            </span>
                            <span className={style.ResultSide}>
                              {NumberFormatter.format(suggestion.city.population)}
                              {' ab.'}
                            </span>
                          </>
                        )
                        : (
                          <>
                            <span className={style.ResultName}>
                              {'Tutta la provincia di '}
                              {highlight(suggestion.province.name, normalizedQuery)}
                            </span>
                            <span className={style.ResultMeta}>{suggestion.province.region}</span>
                            <span className={style.ResultSide}>
                              {suggestion.province.codes.length}
                              {' comuni'}
                            </span>
                          </>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            <div className={style.DropdownHint}>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              {' per muoverti · '}
              <kbd>↵</kbd>
              {' per aggiungere'}
            </div>
          </div>
        )}
      </div>

      { notice && <div className={style.Notice}>{notice}</div> }

      { !loading && visibleQuickPicks.length > 0 && (
        <div className={style.QuickPicks}>
          <span className={style.QuickPicksLabel}>Più cercate</span>
          { visibleQuickPicks.map((city) => (
            <button
              key={city.code}
              type="button"
              className={style.QuickPick}
              onClick={() => commit([city.code], city.name)}
            >
              {city.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { CityPicker }
