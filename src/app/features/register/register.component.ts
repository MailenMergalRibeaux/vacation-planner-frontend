import { Component } from '@angular/core';
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
import {
  Bundesland,
  BUNDESLAENDER,
  BUNDESLAND_LABELS,
  RegisterFuehrungskraftRequest
} from '@app/core/models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  readonly bundeslaender = BUNDESLAENDER;
  readonly bundeslandLabels = BUNDESLAND_LABELS;

  form = this.fb.group(
    {
      id: ['', [Validators.required, Validators.minLength(2)]],
      vorname: ['', [Validators.required, Validators.minLength(2)]],
      nachname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      passwort: ['', [Validators.required, Validators.minLength(8)]],
      passwortBestaetigung: ['', Validators.required],
      bundesland: ['' as Bundesland | '', Validators.required],
      vorgesetzterMitarbeiterId: [''],
      inviteCode: ['', Validators.required]
    },
    { validators: passwordsMatchValidator }
  );

  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: RegisterFuehrungskraftRequest = {
      id: v.id!.trim(),
      vorname: v.vorname!.trim(),
      nachname: v.nachname!.trim(),
      email: v.email!.trim(),
      passwort: v.passwort!,
      bundesland: v.bundesland as Bundesland,
      vorgesetzterMitarbeiterId: v.vorgesetzterMitarbeiterId?.trim() || null,
      inviteCode: v.inviteCode!.trim()
    };

    this.isLoading = true;
    this.error = '';

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = this.errorMessage(err);
      }
    });
  }

  get passwortMismatch(): boolean {
    const errs = this.form.errors;
    const bestaetigung = this.form.get('passwortBestaetigung');
    return !!errs?.['passwortMismatch'] && !!bestaetigung?.touched;
  }

  private errorMessage(err: any): string {
    switch (err?.status) {
      case 403:
        return 'Ungültiger Einladungscode.';
      case 409:
        return 'Diese Mitarbeiter-ID oder E-Mail ist bereits vergeben.';
      case 400: {
        const detail = err?.error?.message
          ?? err?.error?.errors?.[0]?.defaultMessage
          ?? err?.error?.error
          ?? null;
        return detail
          ? `Eingabe ungültig: ${detail}`
          : 'Eingabe ungültig. Bitte Felder prüfen.';
      }
      case 0:
        return 'Verbindung zum Backend nicht möglich. Läuft der Server auf Port 8081?';
      default:
        return 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.';
    }
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const passwort = group.get('passwort')?.value;
  const bestaetigung = group.get('passwortBestaetigung')?.value;
  if (!passwort || !bestaetigung) return null;
  return passwort === bestaetigung ? null : { passwortMismatch: true };
}
