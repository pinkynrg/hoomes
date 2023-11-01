import style from './Dropdowns.module.scss'

interface SortDropdownProps {
  sortBy?: string,
  onSubmit: (sortBy: string) => void
}

const SortDropdown = ({
  sortBy,
  onSubmit,
}: SortDropdownProps) => (
  <div className={style.SortDropdown}>
    {
      [
        { label: 'Affinitá', value: 'match-desc' },
        { label: 'Prezzo', value: 'price-asc' },
        { label: 'Dimensione', value: 'm2-desc' },
        { label: 'Dimensione', value: 'm2-asc' },
        { label: 'Prezzo / Metro', value: 'price_per_meter-asc' },
      ].map((e) => (
        <div onClick={() => onSubmit(e.value)} className={style.ListElement}>
          { sortBy === e.value ? <b>{e.label}</b> : <span>{e.label}</span> }
        </div>
      ))
    }
  </div>
)

export { SortDropdown }
