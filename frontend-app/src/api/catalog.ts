import { request } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: number;
}

export interface ProductAttribute {
  attribute_key: string;
  attribute_value: string;
}

export interface Product {
  productId: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  rating: number;
  isActive: boolean;
  category: string;
  categoryName: string;
  attributes: Record<string, string>;
  attributeList: ProductAttribute[];
  images: string[];
  thumbnail: string | null;
  inventory: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface SearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  availability?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  size?: number;
}

export interface SearchResult {
  items: Product[];
  total: number;
  page: number;
  size: number;
}

export const catalogApi = {
  getCategories: async (): Promise<Category[]> => {
    return request<Category[]>('/categories');
  },

  searchProducts: async (params: SearchParams = {}): Promise<SearchResult> => {
    const query = new URLSearchParams();
    if (params.query) query.set('query', params.query);
    if (params.category) query.set('category', params.category);
    if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
    if (params.brand) query.set('brand', params.brand);
    if (params.rating != null) query.set('rating', String(params.rating));
    if (params.availability) query.set('availability', params.availability);
    if (params.sort) query.set('sort', params.sort);
    if (params.page != null) query.set('page', String(params.page));
    if (params.size != null) query.set('size', String(params.size));

    const qs = query.toString();
    return request<SearchResult>(`/products/search${qs ? `?${qs}` : ''}`);
  },

  getProduct: async (idOrSlug: string): Promise<Product> => {
    return request<Product>(`/products/${idOrSlug}`);
  },

  compareProducts: async (ids: string[]): Promise<{ items: Product[] }> => {
    return request<{ items: Product[] }>(`/products/compare?ids=${ids.join(',')}`);
  },
};
