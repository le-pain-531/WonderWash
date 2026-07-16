const defaultPricing = [
  {
    type: 'Washer',
    capacity: '11 kg',
    machines: '1',
    load: 'Medium',
    price: 'S$6'
  },
  {
    type: 'Washer',
    capacity: '16 kg',
    machines: '3',
    load: 'Large',
    price: 'S$8'
  },
  {
    type: 'Washer',
    capacity: '20 kg',
    machines: '3',
    load: 'Extra Large',
    price: 'S$10'
  },
  {
    type: 'Dryer',
    capacity: '16 kg',
    machines: '6',
    load: '',
    price: 'S$1 per 5 mins'
  }
];

export function cloneDefaultPricing() {
  return defaultPricing.map(item => ({ ...item }));
}

// Add entries here only for outlets with non-standard pricing.
// All other outlets automatically use defaultPricing above.
export const customPricingByOutlet = {
  // 'Outlet Name': [{ type, capacity, machines, load, price }, ...]
};
