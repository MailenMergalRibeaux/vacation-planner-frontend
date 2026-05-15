import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BasicCredentials, MitarbeiterResponse } from '@app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Das Backend nutzt HTTP Basic Auth – kein JWT-Login-Endpunkt.
  private credentialsKey = 'basicCredentials';
  private currentMitarbeiterKey = 'currentMitarbeiter';

  private credentialsSubject = new BehaviorSubject<BasicCredentials | null>(
    this.loadCredentials()
  );
  public credentials$ = this.credentialsSubject.asObservable();

  private currentMitarbeiterSubject = new BehaviorSubject<MitarbeiterResponse | null>(
    this.loadMitarbeiter()
  );
  public currentMitarbeiter$ = this.currentMitarbeiterSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Speichert Credentials und prüft sie per echtem API-Call. */
  login(username: string, password: string): Observable<MitarbeiterResponse[]> {
    const creds: BasicCredentials = { username, password };
    this.saveCredentials(creds);
    this.credentialsSubject.next(creds);
    return this.http.get<MitarbeiterResponse[]>(`${environment.apiUrl}/mitarbeiter`).pipe(
      tap((mitarbeiter: MitarbeiterResponse[]) => {
        const found = mitarbeiter.find(m => m.id === username || m.email === username)
          ?? mitarbeiter[0] ?? null;
        this.currentMitarbeiterSubject.next(found);
        if (found) {
          localStorage.setItem(this.currentMitarbeiterKey, JSON.stringify(found));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.credentialsKey);
    localStorage.removeItem(this.currentMitarbeiterKey);
    this.credentialsSubject.next(null);
    this.currentMitarbeiterSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.credentialsSubject.value !== null;
  }

  getCredentials(): BasicCredentials | null {
    return this.credentialsSubject.value;
  }

  getCurrentMitarbeiter(): MitarbeiterResponse | null {
    return this.currentMitarbeiterSubject.value;
  }

  setCurrentMitarbeiter(m: MitarbeiterResponse): void {
    this.currentMitarbeiterSubject.next(m);
    localStorage.setItem(this.currentMitarbeiterKey, JSON.stringify(m));
  }

  private saveCredentials(creds: BasicCredentials): void {
    localStorage.setItem(this.credentialsKey, JSON.stringify(creds));
  }

  private loadCredentials(): BasicCredentials | null {
    const raw = localStorage.getItem(this.credentialsKey);
    return raw ? JSON.parse(raw) : null;
  }

  private loadMitarbeiter(): MitarbeiterResponse | null {
    const raw = localStorage.getItem(this.currentMitarbeiterKey);
    return raw ? JSON.parse(raw) : null;
  }
}
