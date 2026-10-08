import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FaqQuestion {
  id: number;
  title: string;
  body: string;
  officialAnswer: string | null;
  status: string;
  authorDisplayName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FaqApiService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<FaqQuestion[]> {
    return this.http.get<FaqQuestion[]>('/api/v1/faq');
  }

  submit(payload: { title: string; body: string }): Observable<FaqQuestion> {
    return this.http.post<FaqQuestion>('/api/v1/faq', payload);
  }
}
