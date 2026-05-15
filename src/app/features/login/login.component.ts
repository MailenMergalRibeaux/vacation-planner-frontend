import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form = this.fb.group({
    username: ['admin', Validators.required],
    password: ['admin123', Validators.required]
  });
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.error = '';

    const { username, password } = this.form.value;
    this.authService.login(username!, password!).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = 'Benutzername oder Passwort falsch.';
        } else {
          this.error = 'Verbindung zum Backend nicht möglich. Läuft der Server auf Port 8081?';
        }
        // Gespeicherte Credentials wieder löschen
        this.authService.logout();
      }
    });
  }
}

