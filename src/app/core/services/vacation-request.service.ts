import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VacationRequest {
  id?: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt?: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacationRequestService {
  private apiUrl = 'http://localhost:8080/api/vacation-requests';

  constructor(private http: HttpClient) {}

  // Get all vacation requests with optional filters
  getVacationRequests(
    status?: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 0,
    size: number = 10
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (employeeId) params = params.set('employeeId', employeeId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any>(this.apiUrl, { params });
  }

  // Get a single vacation request
  getVacationRequest(id: string): Observable<VacationRequest> {
    return this.http.get<VacationRequest>(`${this.apiUrl}/${id}`);
  }

  // Create a new vacation request
  createVacationRequest(request: VacationRequest): Observable<VacationRequest> {
    return this.http.post<VacationRequest>(this.apiUrl, request);
  }

  // Update a vacation request
  updateVacationRequest(id: string, request: VacationRequest): Observable<VacationRequest> {
    return this.http.put<VacationRequest>(`${this.apiUrl}/${id}`, request);
  }

  // Delete a vacation request
  deleteVacationRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Approve a vacation request (for managers/admins)
  approveVacationRequest(id: string): Observable<VacationRequest> {
    return this.http.put<VacationRequest>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Reject a vacation request (for managers/admins)
  rejectVacationRequest(id: string, reason: string): Observable<VacationRequest> {
    return this.http.put<VacationRequest>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  // Get vacation requests for current user
  getMyVacationRequests(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-requests`, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  // Get pending vacation requests (for managers)
  getPendingVacationRequests(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pending`, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    });
  }
}

