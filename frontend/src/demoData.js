// OFFLINE UI PREVIEW ONLY. THESE EXAMPLES ARE FICTIONAL, NOT CURRENT MARKET PRICES.
export const DEMO_PRODUCTS = [
  {id: 1, name: 'White Rice', category: 'Rice & Grains', quantity: 1, unit: 'kg', symbol: '🍚'},
  {id: 2, name: 'Red Rice', category: 'Rice & Grains', quantity: 1, unit: 'kg', symbol: '🌾'},
  {id: 3, name: 'White Sugar', category: 'Essentials', quantity: 1, unit: 'kg', symbol: '🧂'},
  {id: 4, name: 'Dhal', category: 'Rice & Grains', quantity: 1, unit: 'kg', symbol: '🫘'},
  {id: 5, name: 'Coconut Oil', category: 'Cooking', quantity: 1, unit: 'L', symbol: '🥥'},
  {id: 6, name: 'Wheat Flour', category: 'Baking', quantity: 1, unit: 'kg', symbol: '🌿'},
  {id: 7, name: 'Milk Powder', category: 'Dairy', quantity: 400, unit: 'g', symbol: '🥛'},
  {id: 8, name: 'Tea Powder', category: 'Beverages', quantity: 200, unit: 'g', symbol: '🍵'}
];
export const DEMO_SHOPS = [
  {id: 1, name: 'Market One', city: 'Batticaloa', district: 'Batticaloa'},
  {id: 2, name: 'Market Two', city: 'Eravur', district: 'Batticaloa'},
  {id: 3, name: 'Market Three', city: 'Anuradhapura', district: 'Anuradhapura'},
  {id: 4, name: 'Market Four', city: 'Polonnaruwa', district: 'Polonnaruwa'}
];
const basePrices = [220, 255, 238, 340, 770, 195, 980, 420];
const increments = [8, 5, 7, 9, 12, 6, 11, 10];
export function demoCompare(productId, district = '') {
  const product = DEMO_PRODUCTS.find(p => p.id === Number(productId));
  const i = DEMO_PRODUCTS.findIndex(p => p.id === Number(productId));
  return {
    product,
    district,
    items: i < 0 ? [] : DEMO_SHOPS.filter(s => !district || s.district === district).map(s => ({
      shop_id: s.id, shop_name: s.name, city: s.city, district: s.district,
      price_lkr: basePrices[i] + s.id * increments[i],
      observed_at: '2026-10-30', is_demo: true
    })).sort((a,b) => a.price_lkr - b.price_lkr)
  };
}
