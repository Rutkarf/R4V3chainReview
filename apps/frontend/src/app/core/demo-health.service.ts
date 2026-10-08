import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, timeout } from 'rxjs';

export type HealthState = 'checking' | 'up' | 'down' | 'unknown';

@Injectable({ providedIn: 'root' })
export class DemoHealthService {
  readonly status = signal<HealthState>('checking');
  readonly checkedAt = signal<Date | null>(null);

  private readonly healthUrl =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/demo-health'
      : 'https://dartchain-backend-1-0-0.onrender.com/api/health';

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  refresh(): void {
    this.status.set('checking');
    this.http
      .get(this.healthUrl, { observe: 'response', responseType: 'text' })
      .pipe(
        timeout(8000),
        map((res) => (res.ok ? ('up' as const) : ('down' as const))),
        catchError(() => of('down' as const)),
      )
      .subscribe((state) => {
        this.status.set(state);
        this.checkedAt.set(new Date());
      });
  }
}
