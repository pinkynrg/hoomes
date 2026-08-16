import { CheckOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import style from './Dropdowns.module.scss'

interface SortDropdownProps {
  sortBy?: string,
  onSubmit: (sortBy: string) => void
}

const SORT_OPTIONS = [
  { label: 'Affinità', value: 'match-desc' },
  { label: 'Prezzo più basso', value: 'price-asc' },
  { label: 'Prezzo più alto', value: 'price-desc' },
  { label: 'Più grandi', value: 'm2-desc' },
  { label: 'Più piccoli', value: 'm2-asc' },
  { label: 'Miglior €/m²', value: 'price_per_meter-asc' },
]

const SortDropdown = ({
  sortBy,
  onSubmit,
}: SortDropdownProps) => (
  <div className={style.SortDropdown}>
    <span className={style.DropdownTitle}>Ordina per</span>
    { SORT_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        className={classnames(style.ListElement, {
          [style.Selected]: sortBy === option.value,
        })}
        onClick={() => onSubmit(option.value)}
      >
        {option.label}
        { sortBy === option.value && <CheckOutlined /> }
      </button>
    ))}
  </div>
)

export { SortDropdown, SORT_OPTIONS }
