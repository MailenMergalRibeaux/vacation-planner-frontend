import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FuehrungskraftEinladungResponse } from '@app/core/models/api.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FuehrungskraftService {
    private readonly baseUrl = '/api/fuehrungskraft';

    constructor(private http: HttpClient) {}

    /**
     * Lädt alle offenen Einladungen für Führungskräfte.
     *
     * Backend-Endpoint: GET /api/fuehrungskraft/einladungen
     */
    getOffeneEinladungen(): Observable<FuehrungskraftEinladungResponse[]> {
        return this.http.get<FuehrungskraftEinladungResponse[]>(
            `${this.baseUrl}/einladungen`
        );
    }

    /**
     * Erzeugt einen Einladungscode für eine neue Führungskraft.
     *
     * Backend-Endpoint: POST /api/fuehrungskraft/invite
     */
    generateFuehrungskraftInvite(): Observable<{ code: string }> {
        return this.http.post<{ code: string }>(
            `${this.baseUrl}/invite`,
            {}
        );
    }
}