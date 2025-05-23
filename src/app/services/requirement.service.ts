import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

export interface Requirement {
  id: string;
  title: string;
  description: string;
  periodicity: string;
  period: string;
  completed: boolean;
  videoUrl?: string;
  hasProvidersButton?: boolean;
  subTitle?: string;
  dependency: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequirementService {
  private endpoint = '/requirements';

  constructor() {}

  getRequirements(dependency: string): Observable<Requirement[]> {
    return new Observable(subscriber => {
      axios.get(`${this.endpoint}?dependency=${dependency}`)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  createRequirement(requirement: Omit<Requirement, 'id'>): Observable<Requirement> {
    return new Observable(subscriber => {
      axios.post(this.endpoint, requirement)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  updateRequirement(id: string, requirement: Partial<Requirement>): Observable<Requirement> {
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}`, requirement)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}