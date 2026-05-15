import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MitarbeiterRequest, MitarbeiterResponse } from '@app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class MitarbeiterService {
  private readonly url = `${environment.apiUrl}/mitarbeiter`;

  constructor(private http: HttpClient) {}

  /** GET /api/mitarbeiter */
  findAll(vorgesetzterMitarbeiterId?: string): Observable<MitarbeiterResponse[]> {
    const params: any = {};
    if (vorgesetzterMitarbeiterId) params['vorgesetzterMitarbeiterId'] = vorgesetzterMitarbeiterId;
    return this.http.get<MitarbeiterResponse[]>(this.url, { params });
  }

  /** GET /api/mitarbeiter/{id} */
  findById(id: string): Observable<MitarbeiterResponse> {
    return this.http.get<MitarbeiterResponse>(`${this.url}/${id}`);
  }

  /** POST /api/mitarbeiter */
  anlegen(request: MitarbeiterRequest): Observable<MitarbeiterResponse> {
    return this.http.post<MitarbeiterResponse>(this.url, request);
  }

  /** PUT /api/mitarbeiter/{id} */
  aktualisieren(id: string, request: MitarbeiterRequest): Observable<MitarbeiterResponse> {
    return this.http.put<MitarbeiterResponse>(`${this.url}/${id}`, request);
  }

  /** DELETE /api/mitarbeiter/{id} */
  loeschen(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

