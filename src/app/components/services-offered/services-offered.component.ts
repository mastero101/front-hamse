import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 

interface IService {
  id: string;
  title: string;
  provider: string;
  providerColor: string;
  price: number;
  infoIcon?: boolean;
  videoUrl?: string;
  storeUrl?: string; 
}

@Component({
  selector: 'app-services-offered',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-offered.component.html',
  styleUrl: './services-offered.component.scss'
})
export class ServicesOfferedComponent implements OnInit{
  
  services: IService[] = [
    { id: 's1', title: 'Justificación técnica de los Límites de Responsabilidad RA y RC', provider: 'NAES', providerColor: '#4CAF50', price: 9310.35, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's2', title: 'Análisis de Riesgos', provider: 'NAES', providerColor: '#4CAF50', price: 6206.90, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's3', title: 'Protocolo de Respuesta a Emergencias (PRE)', provider: 'NAES', providerColor: '#4CAF50', price: 6206.90, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's4', title: 'Cédula de Operación Anual (Incluye su presentación al portal de SERMANAT)', provider: 'NAES', providerColor: '#4CAF50', price: 4800.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's5', title: 'Elaboración de SASISOPA (Incluye curso de capacitación para su implementación)', provider: 'NAES', providerColor: '#4CAF50', price: 18620.70, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's6', title: 'Dictámen SASISOPA (Incluye su ingreso en ASEA, seguimiento hasta su autorización)', provider: 'NAES', providerColor: '#4CAF50', price: 18620.70, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's7', title: 'Elaboración del sistema de gestión de medición SGM (CARPETA RAÍZ)', provider: 'NAES', providerColor: '#4CAF50', price: 6000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's8', title: 'INSPECCIÓN COMPLETA A LA ESTACIÓN (incluye verificación y comprobación de las condiciones de operación, seguridad y documental; así como la entrega de reporte fotográfico y de hallazgos)', provider: 'NAES', providerColor: '#4CAF50', price: 18620.70, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's9', title: 'CURSO DE CAPACITACIÓN EN LÍNEA ASEA/STPS/CRE (incluye constancias DC-3 y diploma)', provider: 'NAES', providerColor: '#4CAF50', price: 1800.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's10', title: 'DICTAMEN NOM-005-ASEA-2016 OPERACIÓN Y MANTENIMIENTO', provider: 'ORKAL', providerColor: '#FF9800', price: 5000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's11', title: 'DICTAMEN NOM-016-CRE-2016 ES', provider: 'ORKAL', providerColor: '#FF9800', price: 3000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's12', title: 'Lavado de tanque (No incluye viáticos) y máximo recolección 2 tambos', provider: 'JLR', providerColor: '#F44336', price: 15800.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's13', title: 'Recolección de tambo de residuos de lavado (No incluye viáticos)', provider: 'JLR', providerColor: '#F44336', price: 1650.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's14', title: 'Lavado de Tanque sin recolección de residuos peligrosos (No incluye Viáticos)', provider: 'JLR', providerColor: '#F44336', price: 12500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's15', title: 'Cubicación a tanque de almacenamiento', provider: 'IPROMER', providerColor: '#00BCD4', price: 7000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's16', title: 'Recalibración y configuración de consola', provider: 'IPROMER', providerColor: '#00BCD4', price: 2500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's17', title: 'Calibración de Sondas Nivel y Temperatura', provider: 'IPROMER', providerColor: '#00BCD4', price: 4500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's18', title: 'Medición de espesores en tanque de almacenamiento subterráneo', provider: 'IPROMER', providerColor: '#00BCD4', price: 15950.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's19', title: 'Dictamen NOM-016-CRE-2016 para la Dictaminación de Análisis de Petrolíferos', provider: 'SIACORP', providerColor: '#9C27B0', price: 3000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's20', title: 'ANÁLISIS DE RIESGO', provider: 'SIACORP', providerColor: '#9C27B0', price: 10500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's21', title: 'CÉDULA DE OPERACIÓN ANUAL', provider: 'SIACORP', providerColor: '#9C27B0', price: 3570.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's22', title: 'PROTOCOLO DE RESPUESTA A EMERGENCIAS (PRE)', provider: 'SIACORP', providerColor: '#9C27B0', price: 10500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's23', title: 'DICTAMEN NOM-005-ASEA-2016', provider: 'SIACORP', providerColor: '#9C27B0', price: 6090.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's24', title: 'AUDITORÍA EXTERNA SASISOPA', provider: 'SIACORP', providerColor: '#9C27B0', price: 9450.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's25', title: 'SISTEMA DE GESTIÓN DE MEDICIONES', provider: 'SIACORP', providerColor: '#9C27B0', price: 15225.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's26', title: 'CONFORMACIÓN Y REGISTRO DE SASISOPA ON LINE', provider: 'SIACORP', providerColor: '#9C27B0', price: 22550.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's27', title: 'SERVICIO A 1 RECIPIENTE SUJETOS A PRESIÓN USADO NOM-020-STPS-2011 INCLUYE VÁLVULA DE SEGURIDAD Y CURSO A 2 PERSONAS', provider: 'ARSADI', providerColor: '#3F51B5', price: 8190.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's28', title: 'ESTUDIO TIERRAS FÍSICAS NOM-022-STPS-2015', provider: 'ARSADI', providerColor: '#3F51B5', price: 4725.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's29', title: 'ESTUDIO ILUMINACIÓN NOM-025-STPS-2008', provider: 'ARSADI', providerColor: '#3F51B5', price: 4725.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's30', title: 'VERIFICACION ELECTRICA NOM-001-SEDE-2012', provider: 'ARSADI', providerColor: '#3F51B5', price: 18000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's31', title: 'VALVULA DE SEGURIDAD 1/4" Y CALIBRADA', provider: 'ARSADI', providerColor: '#3F51B5', price: 1600.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's32', title: 'ESTUDIO DE VULNERABILIDAD DE SEGURIDAD PRIMERA VEZ', provider: 'GDS', providerColor: '#009688', price: 13000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's33', title: 'ESTUDIO DE VULNERABILIDAD DE SEGURIDAD SUBSECUENTE', provider: 'GDS', providerColor: '#009688', price: 6500.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's34', title: 'FORTINET F60 (INCLUYE SOPORTE ANUAL) PRECIO EN DÓLARES', provider: 'ASIAMI', providerColor: '#795548', price: 1140.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's35', title: 'ANTIVIRUS SENTINEL 1 LICENCIA (PRECIO EN DÓLARES)', provider: 'ASIAMI', providerColor: '#795548', price: 39.38, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's36', title: 'PRUEBAS DE HERMETICIDAD ANUALES POR TANQUE (no incluye viáticos)', provider: 'ZESA', providerColor: '#8BC34A', price: 1320.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's37', title: 'PRUEBAS DE HERMETICIDAD INICIALES POR TANQUE (no incluye viáticos)', provider: 'ZESA', providerColor: '#8BC34A', price: 2750.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
    { id: 's38', title: 'DICTAMEN ANEXO 30 Y 31 AÑO 2025', provider: 'VERIFIGAS', providerColor: '#E6A23C', price: 40000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' }, // Color naranja/dorado para VERIFIGAS
    { id: 's39', title: 'DICTAMEN ANEXO 30 Y 31 AÑO 2024', provider: 'VERIFIGAS', providerColor: '#E6A23C', price: 32000.00, infoIcon: true, videoUrl: 'https://youtu.be/LV6M1GK4Fsw', storeUrl: 'https://www.hamse.mx/public/' },
  ];

  isInfoModalVisible = false;
  selectedServiceForModal: IService | null = null;
  safeVideoUrlForInfoModal: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
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
}
