const percentage = (floatValue: number) => (floatValue * 100).toFixed(2) + "%";

const EuroFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export { 
  percentage,
  EuroFormatter,
}
