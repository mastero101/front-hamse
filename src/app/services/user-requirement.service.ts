import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

@Injectable({
  providedIn: 'root'
})
export class UserRequirementService {
  private endpoint = '/user-requirements';

  getAllUserRequirements(): Observable<any> {
    return new Observable(subscriber => {
      axios.get(this.endpoint)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  upsertUserRequirement(data: any): Observable<any> {
    return new Observable(subscriber => {
      axios.post(this.endpoint, data)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  uploadRespaldo(requirementId: string, file: File | null, nota: string): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('nota', nota);
    return new Observable(subscriber => {
      axios.post(`/user-requirements/${requirementId}/respaldo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
} 