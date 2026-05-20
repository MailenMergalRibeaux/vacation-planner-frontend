import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  BasicCredentials,
  LoginRequest,
  MitarbeiterResponse,
  PasswortAenderungRequest,
  RegisterFuehrungskraftRequest,
  Rolle
} from '@app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Auth-Endpunkte liefern den Benutzer; Folgeaufrufe nutzen HTTP Basic Auth
  // mit den hier persistierten Credentials (siehe auth.interceptor).
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

  constructor(private http: HttpClient) {
    this.bootstrapCurrentMitarbeiter();
  }

  /** Login per POST /api/auth/login. Persistiert Credentials und Mitarbeiter-Profil. */
  login(email: string, passwort: string): Observable<MitarbeiterResponse> {
    const body: LoginRequest = { email, passwort };
    return this.http.post<MitarbeiterResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((mitarbeiter) => {
        this.persistSession({ username: email, password: passwort }, mitarbeiter);
      })
    );
  }

  /** Self-Service-Registrierung für Führungskräfte (POST /api/auth/register). */
  register(payload: RegisterFuehrungskraftRequest): Observable<MitarbeiterResponse> {
    return this.http.post<MitarbeiterResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap((mitarbeiter) => {
        this.persistSession(
          { username: payload.email, password: payload.passwort },
          mitarbeiter
        );
      })
    );
  }

  /**
   * Ändert das eigene Passwort (POST /api/auth/change-password).
   * Bei Erfolg werden die Basic-Credentials auf das neue Passwort umgestellt,
   * damit Folgeaufrufe weiterhin authentifiziert sind.
   */
  changePassword(altesPasswort: string, neuesPasswort: string): Observable<MitarbeiterResponse> {
    const body: PasswortAenderungRequest = { altesPasswort, neuesPasswort };
    return this.http.post<MitarbeiterResponse>(`${environment.apiUrl}/auth/change-password`, body).pipe(
      tap((mitarbeiter) => {
        const aktuelle = this.getCredentials();
        const username = aktuelle?.username ?? mitarbeiter.email;
        this.persistSession({ username, password: neuesPasswort }, mitarbeiter);
      })
    );
  }

  /** Erzeugt einen Einladungscode für eine neue Führungskraft (POST /api/auth/invite-fuehrungskraft). */
  generateFuehrungskraftInvite(): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(
        `${environment.apiUrl}/auth/invite-fuehrungskraft`,
        {}
    );
  }

  /** True, wenn der eingeloggte Mitarbeiter sein Passwort wechseln muss, bevor er Funktionen nutzen darf. */
  mussPasswortAendern(): boolean {
    return this.currentMitarbeiterSubject.value?.passwortAenderungErforderlich === true;
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

  hasRole(rolle: Rolle): boolean {
    return this.currentMitarbeiterSubject.value?.rolle === rolle;
  }

  getCredentials(): BasicCredentials | null {
    return this.credentialsSubject.value;
  }

  getCurrentMitarbeiter(): MitarbeiterResponse | null {
    return this.currentMitarbeiterSubject.value;
  }

  private bootstrapCurrentMitarbeiter(): void {
    if (this.currentMitarbeiterSubject.value || !this.credentialsSubject.value) return;

    this.resolveCurrentMitarbeiter().subscribe({
      next: (m) => {
        if (m) this.currentMitarbeiterSubject.next(m);
      },
      error: () => {
        // bewusst still: Session bleibt bestehen, Konsumenten können erneut auflösen
      }
    });
  }

  /**
   * Rehydratisiert das Mitarbeiter-Profil nach Reload anhand der Basic-Credentials,
   * indem der Login-Endpunkt erneut aufgerufen wird.
   */
  resolveCurrentMitarbeiter(): Observable<MitarbeiterResponse | null> {
    const creds = this.getCredentials();
    if (!creds) return of(null);

    return this.login(creds.username, creds.password);
  }

  setCurrentMitarbeiter(m: MitarbeiterResponse): void {
    this.currentMitarbeiterSubject.next(m);
    localStorage.setItem(this.currentMitarbeiterKey, JSON.stringify(m));
  }

  private persistSession(creds: BasicCredentials, mitarbeiter: MitarbeiterResponse): void {
    this.saveCredentials(creds);
    this.credentialsSubject.next(creds);
    this.setCurrentMitarbeiter(mitarbeiter);
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
