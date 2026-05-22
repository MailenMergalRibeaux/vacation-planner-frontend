import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FuehrungskraftEinladungResponse } from '@app/core/models/api.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FuehrungskraftService {
    private readonly baseUrl = '/api/fuehrungskraft';

    constructor(private http: HttpClient) {}

    getOffeneEinladungen(): Observable<FuehrungskraftEinladungResponse[]> {
        return this.http.get<FuehrungskraftEinladungResponse[]>(
            `${this.baseUrl}/einladungen-offen`
        );
    }
}