export interface Product {
    id: string;
    ownerId: string;
    name: string;
    sku: string;
    price: number;
    stockQuantity: number;
    thresholdLevel: number;
    supplierId?: string;
    description?: string;
    createdAt: any;
    updatedAt?: any;
}

export interface User {
    uid: string;
    email: string;
    shopName: string;
    languagePreference?: 'english' | 'roman_urdu';
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  createdAt: any;
}
