export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Rate to base currency (IDR)
}

export interface Trip {
  id: string;
  traveler: Traveler;
  origin: string;
  destination: string;
  date: string;
  status: 'active' | 'upcoming' | 'completed';
  categories: string[];
  currency?: Currency;
  weightLimit?: number;
  weightUsed?: number;
}

export interface Traveler {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  tripsCount: number;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  location: string;
  stock: number;
}

export interface Order {
  id: string;
  customerName: string;
  price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'found' | 'out_of_stock';
  date: string;
  image: string;
  items: WishlistItem[];
  paymentStatus: 'unpaid' | 'paid';
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  status: 'pending' | 'found' | 'out_of_stock' | 'cancelled';
  note?: string;
  qty?: number;
}
