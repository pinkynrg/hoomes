const percentage = (floatValue: number) => `${(floatValue * 100).toFixed(2)}%`

const NumberFormatter = Intl.NumberFormat('it-IT')

const EuroFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

const stringToNumber = (formattedNumber: string) => parseFloat(formattedNumber.replace(/[^\d]/g, ''))

export {
  percentage,
  EuroFormatter,
  NumberFormatter,
  stringToNumber,
}
