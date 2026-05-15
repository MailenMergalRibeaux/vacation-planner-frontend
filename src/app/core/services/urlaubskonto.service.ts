import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UrlaubskontoRequest, UrlaubskontoResponse } from '@app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class UrlaubskontoService {
  private readonly url = `${environment.apiUrl}/urlaubskonten`;

  constructor(private http: HttpClient) {}

  /** GET /api/urlaubskonten?mitarbeiterId=... */
  findByMitarbeiter(mitarbeiterId: string): Observable<UrlaubskontoResponse[]> {
    return this.http.get<UrlaubskontoResponse[]>(this.url, {
      params: { mitarbeiterId }
    });
  }

  /** GET /api/urlaubskonten/{mitarbeiterId}/{jahr} */
  findByMitarbeiterUndJahr(mitarbeiterId: string, jahr: number): Observable<UrlaubskontoResponse> {
    return this.http.get<UrlaubskontoResponse>(`${this.url}/${mitarbeiterId}/${jahr}`);
  }

  /** POST /api/urlaubskonten */
  anlegen(request: UrlaubskontoRequest): Observable<UrlaubskontoResponse> {
    return this.http.post<UrlaubskontoResponse>(this.url, request);
  }

  /** PATCH /api/urlaubskonten/{mitarbeiterId}/{jahr}/gesamttage?gesamtTage=... */
  gesamtTageAktualisieren(mitarbeiterId: string, jahr: number, gesamtTage: number): Observable<UrlaubskontoResponse> {
    return this.http.patch<UrlaubskontoResponse>(
      `${this.url}/${mitarbeiterId}/${jahr}/gesamttage`,
      null,
      { params: { gesamtTage: gesamtTage.toString() } }
    );
  }
}

