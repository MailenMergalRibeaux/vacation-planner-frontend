import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AntragStatus,
  StatusUpdateRequest,
  UrlaubsAntragRequest,
  UrlaubsAntragResponse
} from '@app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class UrlaubsAntragService {
  private readonly url = `${environment.apiUrl}/urlaubsantraege`;

  // Event-Stream für Änderungen an offenen Genehmigungen
  private offeneGenehmigungenChangedSubject = new Subject<void>();
  offeneGenehmigungenChanged$ = this.offeneGenehmigungenChangedSubject.asObservable();

  constructor(private http: HttpClient) {}

  notifyOffeneGenehmigungenChanged(): void {
    this.offeneGenehmigungenChangedSubject.next();
  }

  /** POST /api/urlaubsantraege */
  erstellen(request: UrlaubsAntragRequest): Observable<UrlaubsAntragResponse> {
    return this.http.post<UrlaubsAntragResponse>(this.url, request);
  }

  /** GET /api/urlaubsantraege */
  findAll(mitarbeiterId?: string, status?: AntragStatus): Observable<UrlaubsAntragResponse[]> {
    let params = new HttpParams();
    if (mitarbeiterId) params = params.set('mitarbeiterId', mitarbeiterId);
    if (status) params = params.set('status', status);
    return this.http.get<UrlaubsAntragResponse[]>(this.url, { params });
  }

  /** GET /api/urlaubsantraege/{id} */
  findById(id: number): Observable<UrlaubsAntragResponse> {
    return this.http.get<UrlaubsAntragResponse>(`${this.url}/${id}`);
  }

  /** PUT /api/urlaubsantraege/{id} */
  aktualisieren(id: number, request: UrlaubsAntragRequest): Observable<UrlaubsAntragResponse> {
    return this.http.put<UrlaubsAntragResponse>(`${this.url}/${id}`, request);
  }

  /** PATCH /api/urlaubsantraege/{id}/status */
  statusAktualisieren(id: number, request: StatusUpdateRequest): Observable<UrlaubsAntragResponse> {
    const statusUrl = `${this.url}/${id}/status`;
    return this.http.patch<UrlaubsAntragResponse>(statusUrl, request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manche Backends erlauben auf /status nur PUT.
        if (error.status !== 405) throw error;
        return this.http.put<UrlaubsAntragResponse>(statusUrl, request);
      })
    );
  }

  /** Kurzform: einen Antrag genehmigen */
  genehmigen(id: number, kommentar?: string): Observable<UrlaubsAntragResponse> {
    return this.statusAktualisieren(id, { status: 'GENEHMIGT', kommentar });
  }

  /** Kurzform: einen Antrag ablehnen */
  ablehnen(id: number, kommentar?: string): Observable<UrlaubsAntragResponse> {
    return this.statusAktualisieren(id, { status: 'ABGELEHNT', kommentar });
  }

  /** Kurzform: einen Antrag stornieren */
  stornieren(id: number, kommentar?: string): Observable<UrlaubsAntragResponse> {
    return this.statusAktualisieren(id, { status: 'STORNIERT', kommentar });
  }

  /** DELETE /api/urlaubsantraege/{id} */
  loeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

}

