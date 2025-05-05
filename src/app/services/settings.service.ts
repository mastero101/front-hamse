import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import axiosInstance from '../config/axios.config';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private endpoint = '/settings';

  constructor() {}

  /**
   * Obtiene el número de WhatsApp configurado.
   * No requiere autenticación.
   * @returns Un Observable que emite un objeto con la propiedad whatsappNumber.
   */
  getWhatsappNumber(): Observable<{ whatsappNumber: string }> {
    // Usamos 'from' para convertir la promesa de Axios en un Observable
    return from(axiosInstance.get<{ whatsappNumber: string }>(`${this.endpoint}/whatsapp`))
      // Mapeamos la respuesta para obtener solo los datos
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Actualiza el número de WhatsApp.
   * Requiere autenticación y rol de administrador (gestionado por el interceptor de Axios y el backend).
   * @param whatsappNumber El nuevo número de WhatsApp.
   * @returns Un Observable que emite la respuesta del servidor (puede ser un mensaje de éxito).
   */
  updateWhatsappNumber(whatsappNumber: string): Observable<any> {
    // Usamos 'from' para convertir la promesa de Axios en un Observable
    return from(axiosInstance.put(`${this.endpoint}/whatsapp`, { whatsappNumber }));
    // No necesitamos mapear la respuesta aquí a menos que queramos extraer datos específicos
  }
}

// Necesitamos importar 'map' de rxjs/operators
import { map } from 'rxjs/operators';