import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface ReviewUser {
  id: number;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: ReviewUser;
}

const TOKEN_KEY = 'dcr_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<ReviewUser | null>(null);
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  constructor(private readonly http: HttpClient) {
    if (this.getToken()) {
      this.refreshMe().subscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  register(payload: { email: string; displayName: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/register', payload).pipe(tap((res) => this.persist(res)));
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/login', payload).pipe(tap((res) => this.persist(res)));
  }

  refreshMe(): Observable<ReviewUser | null> {
    return this.http.get<ReviewUser>('/api/v1/auth/me').pipe(
      tap((user) => this.userSignal.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): void {
    this.clearSession();
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.userSignal.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSignal.set(null);
  }
}
