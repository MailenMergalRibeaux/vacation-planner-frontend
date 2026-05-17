import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { MitarbeiterResponse } from '@app/core/models/api.models';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  form = this.fb.group(
    {
      altesPasswort: ['', Validators.required],
      neuesPasswort: ['', [Validators.required, Validators.minLength(8)]],
      neuesPasswortBestaetigung: ['', Validators.required]
    },
    { validators: [passwordsMatchValidator, mustDifferValidator] }
  );

  isLoading = false;
  error = '';
  success = '';
  mitarbeiter: MitarbeiterResponse | null = null;
  forced = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mitarbeiter = this.authService.getCurrentMitarbeiter();
    this.forced = this.authService.mussPasswortAendern();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { altesPasswort, neuesPasswort } = this.form.value;
    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.authService.changePassword(altesPasswort!, neuesPasswort!).subscribe({
      next: (m) => {
        this.isLoading = false;
        this.mitarbeiter = m;
        this.forced = false;
        this.success = 'Passwort erfolgreich geändert.';
        this.form.reset();
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = this.errorMessage(err);
      }
    });
  }

  get passwortMismatch(): boolean {
    return !!this.form.errors?.['passwortMismatch']
      && !!this.form.get('neuesPasswortBestaetigung')?.touched;
  }

  get gleichWieAlt(): boolean {
    return !!this.form.errors?.['gleichWieAlt']
      && !!this.form.get('neuesPasswort')?.touched;
  }

  private errorMessage(err: any): string {
    const detail: string | undefined = err?.error?.detail ?? err?.error?.message;

    if (err?.status === 400) {
      if (detail?.includes('Aktuelles Passwort ist falsch')) {
        return 'Aktuelles Passwort ist falsch.';
      }
      if (detail?.includes('Neues Passwort muss sich vom aktuellen unterscheiden')) {
        return 'Das neue Passwort muss sich vom aktuellen unterscheiden.';
      }
      return detail ? `Eingabe ungültig: ${detail}` : 'Eingabe ungültig. Bitte Felder prüfen.';
    }
    if (err?.status === 401) {
      return 'Nicht angemeldet. Bitte erneut einloggen.';
    }
    if (err?.status === 0) {
      return 'Verbindung zum Backend nicht möglich.';
    }
    return 'Passwortänderung fehlgeschlagen. Bitte später erneut versuchen.';
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const neu = group.get('neuesPasswort')?.value;
  const bestaetigung = group.get('neuesPasswortBestaetigung')?.value;
  if (!neu || !bestaetigung) return null;
  return neu === bestaetigung ? null : { passwortMismatch: true };
}

function mustDifferValidator(group: AbstractControl): ValidationErrors | null {
  const alt = group.get('altesPasswort')?.value;
  const neu = group.get('neuesPasswort')?.value;
  if (!alt || !neu) return null;
  return alt === neu ? { gleichWieAlt: true } : null;
}
