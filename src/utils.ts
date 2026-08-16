const percentage = (floatValue: number) => `${Math.round(floatValue * 100)}%`

const NumberFormatter = Intl.NumberFormat('it-IT')

const EuroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/* Short price label used inside filter chips: 1.250.000 € -> "1,3 mln €" */
const compactEuro = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',').replace(',0', '')} mln €`
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k €`
  }
  return `${value} €`
}

const stringToNumber = (formattedNumber: string) => parseFloat(formattedNumber.replace(/[^\d]/g, ''))

export {
  percentage,
  EuroFormatter,
  NumberFormatter,
  compactEuro,
  stringToNumber,
}
