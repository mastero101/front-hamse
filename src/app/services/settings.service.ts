import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import axiosInstance from '../config/axios.config';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private endpoint = '/settings';
  private uploadEndpoint = '/uploads/image';

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

  /**
   * Obtiene cualquier setting por key.
   * @param key La clave del setting.
   * @returns Un Observable con { key, value }
   */
  getSettingByKey(key: string): Observable<{ key: string, value: string }> {
    return from(axiosInstance.get<{ key: string, value: string }>(`${this.endpoint}/${key}`))
      .pipe(map(response => response.data));
  }

  /**
   * Actualiza cualquier setting por key.
   * @param key La clave del setting.
   * @param value El valor a guardar.
   * @returns Un Observable con la respuesta del backend
   */
  updateSettingByKey(key: string, value: string): Observable<any> {
    return from(axiosInstance.put(`${this.endpoint}/${key}`, { value }));
  }

  /**
   * Sube una imagen al servidor y devuelve la URL de S3
   * @param file Archivo a subir
   * @returns Observable con { status, url }
   */
  uploadImage(file: File): Observable<{ status: string, url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return from(
      axiosInstance.post(this.uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    ).pipe(
      // Extraer solo los datos relevantes
      map(response => response.data)
    );
  }
}