import axiosInstance from '../config/axios.config';
import { Injectable } from '@angular/core';

export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  url?: string;
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/products';

  async getProducts(): Promise<IProduct[]> {
    const response = await axiosInstance.get<IProduct[]>(this.apiUrl);
    return response.data;
  }

} 