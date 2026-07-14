import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api';
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private hasToken(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  getUserEmail(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('email');
    }
    return null;
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  register(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('email', res.email);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('email', res.email);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    this.isLoggedInSubject.next(false);
  }

  getTasks(filters?: { status?: string; priority?: string; search?: string }): Observable<any> {
    let url = `${this.baseUrl}/tasks`;
    const params: string[] = [];
    if (filters) {
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.priority) params.push(`priority=${filters.priority}`);
      if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get(url, { headers: this.getHeaders() });
  }

  createTask(task: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks`, task, { headers: this.getHeaders() });
  }

  updateTask(id: string, task: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/tasks/${id}`, task, { headers: this.getHeaders() });
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tasks/${id}`, { headers: this.getHeaders() });
  }
}
