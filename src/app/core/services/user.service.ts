import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  // Get all users
  getAllUsers(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  // Get a single user
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Get current user profile
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  // Update user profile
  updateUserProfile(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, user);
  }

  // Update a user (admin only)
  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  // Delete a user (admin only)
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Create a new user (admin only)
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // Get users by department
  getUsersByDepartment(department: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/department/${department}`);
  }
}

