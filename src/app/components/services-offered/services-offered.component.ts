import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 
import { ProductService, IProduct } from '../../services/product.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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
  isAdmin: boolean = false;
  isSyncing: boolean = false;

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

  // NUEVA PROPIEDAD: Para tracking de cambios de precios
  private priceHistory: { [productId: string]: { oldPrice: number, newPrice: number, timestamp: Date }[] } = {};

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

  constructor(
    private sanitizer: DomSanitizer,
    private productService: ProductService,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      console.log('🔄 [INICIO] Cargando productos...');
      
      this.products = await this.productService.getProducts();
      
      // 📊 LOG DETALLADO: Estado inicial de productos
      console.log('📦 [PRODUCTOS] Total cargados:', this.products.length);
      console.log('📦 [PRODUCTOS] Con stock=1:', this.products.filter(p => p.stock === 1).length);
      
      // 💰 LOG DETALLADO: Precios actuales
      this.logPricesSummary();
      
      this.providers = Array.from(new Set(this.products.map(p => p.supplier).filter((s): s is string => !!s)));
      this.applyFilters();
      this.isAdmin = this.authService.currentUserValue?.role === 'admin';
      
      console.log('✅ [PRODUCTOS] Inicialización completada');
      console.log('[ServicesOfferedComponent] Productos obtenidos:', this.products);
    } catch (err) {
      console.error('❌ [ERROR] Al obtener productos:', err);
    }
  }

  // 📊 MÉTODO CORREGIDO: Log resumen de precios
  logPricesSummary(): void {
    console.group('💰 [PRECIOS] Resumen actual');
    
    const activeProducts = this.products.filter(p => p.stock === 1);
    
    console.log('📈 Estadísticas de precios:');
    console.log('- Total productos activos:', activeProducts.length);
    
    if (activeProducts.length > 0) {
      console.log('- Precio mínimo:', Math.min(...activeProducts.map(p => p.price)));
      console.log('- Precio máximo:', Math.max(...activeProducts.map(p => p.price)));
      console.log('- Precio promedio:', (activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length).toFixed(2));
    }
    
    // Log por proveedor
    const byProvider = activeProducts.reduce((acc, p) => {
      if (!acc[p.supplier!]) acc[p.supplier!] = [];
      acc[p.supplier!].push(p);
      return acc;
    }, {} as { [key: string]: IProduct[] });
    
    console.log('📊 Por proveedor:');
    Object.entries(byProvider).forEach(([provider, products]) => {
      const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
      console.log(`  - ${provider}: ${products.length} productos, precio promedio: $${avgPrice.toFixed(2)}`);
    });
    
    // CORREGIDO: Usar updatedAt en lugar de updated_at
    console.log('🕒 Últimas actualizaciones:');
    const recentUpdates = activeProducts
      .filter(p => p.updatedAt)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 5);
    
    recentUpdates.forEach(p => {
      console.log(`  - ${p.name}: $${p.price} (${new Date(p.updatedAt!).toLocaleString()})`);
    });
    
    console.groupEnd();
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
    let filtered = this.products.filter(p => p.stock === 1);
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

  // 🔄 MÉTODO MEJORADO: Sincronización con más logging
  async syncPrices(): Promise<void> {
    console.log('🚀 [SYNC] Iniciando sincronización de precios...');
    
    // CORREGIDO: Usar updatedAt en lugar de updated_at
    const oldPrices = this.products.reduce((acc, p) => {
      acc[p.id.toString()] = { price: p.price, updatedAt: p.updatedAt };
      return acc;
    }, {} as { [id: string]: { price: number, updatedAt?: string } });
    
    this.isSyncing = true;
    
    try {
      console.log('📡 [SYNC] Llamando a API de sincronización...');
      const startTime = Date.now();
      
      const res = await this.productService.syncPrices();
      
      const endTime = Date.now();
      console.log(`⚡ [SYNC] API respondió en ${endTime - startTime}ms`);
      console.log('📋 [SYNC] Respuesta:', res);
      
      // Recargar productos
      console.log('🔄 [SYNC] Recargando productos actualizados...');
      this.products = await this.productService.getProducts();
      
      // Comparar cambios
      this.compareAndLogPriceChanges(oldPrices);
      
      // Actualizar vista
      this.applyFilters();
      
      // Log nuevo estado
      this.logPricesSummary();
      
      alert(`✅ Sincronización completada: ${res.updated} productos actualizados`);
      
    } catch (err: any) {
      console.error('❌ [SYNC] Error:', err);
      alert('❌ Error al sincronizar precios: ' + (err?.response?.data?.error || err.message));
    } finally {
      this.isSyncing = false;
      console.log('🏁 [SYNC] Proceso finalizado');
    }
  }

  // 🔍 MÉTODO CORREGIDO: Comparar y mostrar cambios de precios
  private compareAndLogPriceChanges(oldPrices: { [id: string]: { price: number, updatedAt?: string } }): void {
    console.group('🔄 [CAMBIOS] Comparación de precios');
    
    let changesFound = 0;
    const changes: Array<{
      id: string,
      name: string,
      supplier: string,
      oldPrice: number,
      newPrice: number,
      difference: number,
      percentChange: number
    }> = [];
    
    this.products.forEach(product => {
      const productIdStr = product.id.toString(); // CORREGIDO: Convertir a string
      const oldData = oldPrices[productIdStr];
      if (oldData && oldData.price !== product.price) {
        const difference = product.price - oldData.price;
        const percentChange = ((difference / oldData.price) * 100);
        
        changes.push({
          id: productIdStr, // CORREGIDO: Usar string
          name: product.name,
          supplier: product.supplier || 'Sin proveedor',
          oldPrice: oldData.price,
          newPrice: product.price,
          difference,
          percentChange
        });
        
        changesFound++;
      }
    });
    
    if (changesFound === 0) {
      console.log('ℹ️ No se detectaron cambios de precios');
    } else {
      console.log(`📊 Se detectaron ${changesFound} cambios de precios:`);
      
      changes.forEach(change => {
        const arrow = change.difference > 0 ? '📈' : '📉';
        const sign = change.difference > 0 ? '+' : '';
        console.log(
          `${arrow} ${change.name} (${change.supplier}):`,
          `$${change.oldPrice} → $${change.newPrice}`,
          `(${sign}$${change.difference.toFixed(2)}, ${change.percentChange >= 0 ? '+' : ''}${change.percentChange.toFixed(1)}%)`
        );
      });
      
      // Estadísticas de cambios
      const increases = changes.filter(c => c.difference > 0);
      const decreases = changes.filter(c => c.difference < 0);
      
      console.log('📊 Resumen de cambios:');
      console.log(`  - Aumentos: ${increases.length}`);
      console.log(`  - Disminuciones: ${decreases.length}`);
      
      if (increases.length > 0) {
        const avgIncrease = increases.reduce((sum, c) => sum + c.percentChange, 0) / increases.length;
        console.log(`  - Aumento promedio: ${avgIncrease.toFixed(1)}%`);
      }
      
      if (decreases.length > 0) {
        const avgDecrease = decreases.reduce((sum, c) => sum + c.percentChange, 0) / decreases.length;
        console.log(`  - Disminución promedio: ${avgDecrease.toFixed(1)}%`);
      }
    }
    
    console.groupEnd();
  }

  // 🧪 MÉTODO CORREGIDO: Verificar conectividad con API
  async testApiConnection(): Promise<void> {
    console.log('🔌 [TEST] Verificando conexión con API...');
    
    try {
      const startTime = Date.now();
      
      // Test básico - obtener productos
      const products = await this.productService.getProducts();
      
      const endTime = Date.now();
      
      console.log('✅ [TEST] API respondió correctamente');
      console.log(`⚡ [TEST] Tiempo de respuesta: ${endTime - startTime}ms`);
      console.log(`📦 [TEST] Productos obtenidos: ${products.length}`);
      
      // Verificar estructura de datos
      if (products.length > 0) {
        const sample = products[0];
        console.log('🔍 [TEST] Estructura del primer producto:', {
          id: sample.id,
          name: sample.name,
          price: sample.price,
          stock: sample.stock,
          supplier: sample.supplier,
          updatedAt: sample.updatedAt, // CORREGIDO: Usar updatedAt
          hasRequiredFields: !!(sample.id && sample.name && typeof sample.price === 'number')
        });
      }
      
      alert('✅ Test de API completado. Revisa la consola para detalles.');
      
    } catch (error) {
      console.error('❌ [TEST] Error de conectividad:', error);
      alert('❌ Error en test de API. Revisa la consola para detalles.');
    }
  }

  // 📊 MÉTODO CORREGIDO: Mostrar estadísticas en tiempo real
  getProductStats(): any {
    const activeProducts = this.filteredProducts;
    
    if (activeProducts.length === 0) {
      return {
        total: 0,
        providers: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        lastUpdate: null
      };
    }
    
    return {
      total: activeProducts.length,
      providers: new Set(activeProducts.map(p => p.supplier)).size,
      priceRange: {
        min: Math.min(...activeProducts.map(p => p.price)),
        max: Math.max(...activeProducts.map(p => p.price)),
        avg: activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length
      },
      lastUpdate: activeProducts
        .filter(p => p.updatedAt) // CORREGIDO: Usar updatedAt
        .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())[0]?.updatedAt
    };
  }
}