import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    passwort: ['', Validators.required]
  });
  isLoading = false;
  error = '';
  info = ''; // für Timeout-/Info-Meldungen

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'timeout') {
        this.info = 'Sie wurden aufgrund von Inaktivität automatisch abgemeldet.';
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.error = '';
    this.info = '';

    const { email, passwort } = this.form.value;

    this.authService.login(email!, passwort!).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = 'E-Mail oder Passwort falsch.';
        } else {
          this.error = 'Verbindung zum Backend nicht möglich. Läuft der Server auf Port 58080?';
        }
        this.authService.logout();
      }
    });
  }
}
