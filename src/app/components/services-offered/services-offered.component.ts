import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 
import { ProductService, IProduct } from '../../services/product.service';
import { FormsModule } from '@angular/forms';

interface IService {
  id: string;
  title: string;
  provider: string;
  providerColor: string;
  price: number;
  infoIcon?: boolean;
  videoUrl?: string;
  storeUrl?: string; 
  providers?: { name: string; color: string }[];
}

@Component({
  selector: 'app-services-offered',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-offered.component.html',
  styleUrl: './services-offered.component.scss'
})
export class ServicesOfferedComponent implements OnInit{
  isInfoModalVisible = false;
  selectedServiceForModal: IService | null = null;
  safeVideoUrlForInfoModal: SafeResourceUrl | null = null;
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];

  // Búsqueda y filtros
  searchTerm: string = '';
  selectedProvider: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minStock: number | null = null;
  maxStock: number | null = null;
  providers: string[] = [];

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 25;
  totalPages: number = 1;

  // Ordenamiento
  sortField: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Umbral de pocos disponibles
  lowStockThreshold: number = 3;

  private providerColors: { [key: string]: string } = {};
  private colorPalette: string[] = [
    '#4CAF50', // Verde
    '#FF9800', // Naranja
    '#2196F3', // Azul
    '#9C27B0', // Morado
    '#E91E63', // Rosa
    '#00BCD4', // Cyan
    '#795548', // Café
    '#8BC34A', // Verde claro
    '#E6A23C', // Dorado
    '#3F51B5', // Azul oscuro
    '#009688', // Verde azulado
    '#F44336', // Rojo
  ];

  constructor(private sanitizer: DomSanitizer, private productService: ProductService) { }

  async ngOnInit(): Promise<void> {
    try {
      this.products = await this.productService.getProducts();
      this.providers = Array.from(new Set(this.products.map(p => p.supplier).filter((s): s is string => !!s)));
      this.applyFilters();
      console.log('[ServicesOfferedComponent] Productos obtenidos:', this.products);
    } catch (err) {
      console.error('Error al obtener productos:', err);
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedProvider = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minStock = null;
    this.maxStock = null;
    this.sortField = 'name';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  setSort(field: string, direction: 'asc' | 'desc') {
    this.sortField = field;
    this.sortDirection = direction;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.products;
    // Búsqueda por nombre o proveedor
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.supplier && p.supplier.toLowerCase().includes(term))
      );
    }
    // Filtro por proveedor
    if (this.selectedProvider) {
      filtered = filtered.filter(p => p.supplier === this.selectedProvider);
    }
    // Filtro por rango de precio
    if (this.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= this.minPrice!);
    }
    if (this.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= this.maxPrice!);
    }
    // Filtro por stock
    if (this.minStock !== null) {
      filtered = filtered.filter(p => p.stock >= this.minStock!);
    }
    if (this.maxStock !== null) {
      filtered = filtered.filter(p => p.stock <= this.maxStock!);
    }
    // Ordenamiento
    filtered = filtered.slice().sort((a, b) => {
      let valA = a[this.sortField as keyof IProduct];
      let valB = b[this.sortField as keyof IProduct];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return this.sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc'
          ? valA - valB
          : valB - valA;
      }
      return 0;
    });
    this.filteredProducts = filtered;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
  }

  get paginatedProducts(): IProduct[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openInfoModal(service: IService): void {
    this.selectedServiceForModal = service;
    let videoUrl = service.videoUrl;

    if (videoUrl && videoUrl.trim() !== '') {
      // Convertir URL de youtu.be a formato embed si es necesario
      if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1].split('?')[0]; // Obtener ID del video
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      this.safeVideoUrlForInfoModal = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
      console.log('[ServicesOfferedComponent] Video URL encontrada y procesada:', this.safeVideoUrlForInfoModal);
    } else {
      this.safeVideoUrlForInfoModal = null;
      console.warn(`[ServicesOfferedComponent] Modal de información abierto para el servicio "${service.title}" pero no se definió videoUrl o está vacía.`);
    }
    this.isInfoModalVisible = true;
    console.log('[ServicesOfferedComponent] isInfoModalVisible se estableció en:', this.isInfoModalVisible);
  }

  closeInfoModal(): void {
    this.isInfoModalVisible = false;
    this.selectedServiceForModal = null;
    this.safeVideoUrlForInfoModal = null;
  }

  goToStore(service: IService): void {
    const defaultStoreUrl = 'https://www.hamse.mx/public/';
    const urlToOpen = service.storeUrl || defaultStoreUrl;
    
    console.log(`Navegando a la tienda para el servicio "${service.title}": ${urlToOpen}`);
    window.open(urlToOpen, '_blank');
  }

  goToProductUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  getProviderColor(provider: string): string {
    if (!this.providerColors[provider]) {
      const idx = Object.keys(this.providerColors).length % this.colorPalette.length;
      this.providerColors[provider] = this.colorPalette[idx];
    }
    return this.providerColors[provider];
  }

  // Paginador avanzado con saltos y rango dinámico
  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 5;
    const range: (number | string)[] = [];
    let l: number;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  }

  goToPageIfNumber(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }
}
