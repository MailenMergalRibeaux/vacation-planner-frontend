import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import {
  Bundesland,
  BUNDESLAND_LABELS,
  MitarbeiterRequest,
  MitarbeiterResponse,
  Rolle
} from '@app/core/models/api.models';
import { AuthService } from '@app/core/services/auth.service';
import { FlashMessageService } from '@app/core/services/flash-message.service';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';

const ROLLE_LABELS: Record<Rolle, string> = {
  MITARBEITER: 'Mitarbeiter:in',
  FUEHRUNGSKRAFT: 'Führungskraft'
};

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  currentMitarbeiter = this.authService.getCurrentMitarbeiter();

  form = this.fb.group({
    id: ['', [Validators.required, Validators.minLength(2)]],
    vorname: ['', [Validators.required, Validators.minLength(2)]],
    nachname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    rolle: ['MITARBEITER' as Rolle, Validators.required],
    passwort: [''],
    bundesland: ['BE' as Bundesland, Validators.required],
    vorgesetzterMitarbeiterId: ['']
  });

  isLoading = false;
  isSaving = false;
  fehler = '';
  editId: string | null = null;

  readonly bundeslaender = Object.keys(BUNDESLAND_LABELS) as Bundesland[];
  readonly bundeslandLabels = BUNDESLAND_LABELS;
  readonly rollen: Rolle[] = ['MITARBEITER', 'FUEHRUNGSKRAFT'];
  readonly rollenLabels = ROLLE_LABELS;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private flashMessageService: FlashMessageService,
    private mitarbeiterService: MitarbeiterService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form.controls.rolle.valueChanges.subscribe(() => this.updateVorgesetzterValidator());

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.editId = id;

      if (id) {
        this.form.controls.id.disable();
        this.ladeMitarbeiter(id);
        // Vorgesetzter ist im Edit-Fall nicht änderbar -> keine automatische Anpassung mehr
        this.form.controls.vorgesetzterMitarbeiterId.disable({ emitEvent: false });
      } else {
        this.form.controls.id.enable();

        const current = this.currentMitarbeiter;
        if (current?.id && this.form.controls.rolle.value === 'MITARBEITER') {
          this.form.patchValue({ vorgesetzterMitarbeiterId: current.id });
        }
      }

      this.updateVorgesetzterValidator();
      this.updatePasswortValidator();
    });
  }

  private updatePasswortValidator(): void {
    const control = this.form.controls.passwort;
    if (this.editId) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required, Validators.minLength(8)]);
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateVorgesetzterValidator(): void {
    const control = this.form.controls.vorgesetzterMitarbeiterId;
    control.clearValidators();
    control.updateValueAndValidity({ emitEvent: false });
  }

  ladeMitarbeiter(id: string): void {
    this.isLoading = true;
    this.mitarbeiterService.findById(id).subscribe({
      next: (m: MitarbeiterResponse) => {
        this.form.patchValue({
          id: m.id,
          vorname: m.vorname,
          nachname: m.nachname,
          email: m.email,
          rolle: m.rolle,
          bundesland: m.bundesland,
          vorgesetzterMitarbeiterId: m.vorgesetzterMitarbeiterId ?? ''
        });
        this.updateVorgesetzterValidator();
        this.isLoading = false;
      },
      error: () => {
        this.fehler = 'Mitarbeiter konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  speichern(): void {
    if (this.form.invalid) {
      this.fehler = 'Bitte alle Pflichtfelder korrekt ausfuellen.';
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const id = rawValue.id?.trim() ?? '';
    const vorname = rawValue.vorname?.trim() ?? '';
    const nachname = rawValue.nachname?.trim() ?? '';
    const email = rawValue.email?.trim() ?? '';
    const passwort = rawValue.passwort ?? '';
    const vorgesetzterMitarbeiterId = rawValue.vorgesetzterMitarbeiterId?.trim() || null;

    const request: MitarbeiterRequest = {
      id,
      vorname,
      nachname,
      email,
      rolle: rawValue.rolle as Rolle,
      ...(this.editId ? {} : { passwort }),
      bundesland: rawValue.bundesland as Bundesland,
      vorgesetzterMitarbeiterId
    };

    // Mehrere Varianten fuer unterschiedliche Backend-DTO-Versionen.
    const payloads: Record<string, any>[] = [
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        rolle: request.rolle,
        ...(request.passwort ? { passwort: request.passwort } : {}),
        bundesland: request.bundesland,
        vorgesetzterMitarbeiterId: request.vorgesetzterMitarbeiterId
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        ...(request.passwort ? { passwort: request.passwort } : {}),
        bundesland: request.bundesland,
        vorgesetzterMitarbeiterId: request.vorgesetzterMitarbeiterId
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        rolle: request.rolle,
        ...(request.passwort ? { passwort: request.passwort } : {}),
        bundesland: request.bundesland
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        ...(request.passwort ? { passwort: request.passwort } : {}),
        bundesland: request.bundesland
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        rolle: request.rolle,
        ...(request.passwort ? { passwort: request.passwort } : {}),
        bundesland: request.bundesland,
        vorgesetzterId: request.vorgesetzterMitarbeiterId
      }
    ];

    this.isSaving = true;
    this.fehler = '';

    const request$ = this.saveWithFallbacks(payloads, 0);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.flashMessageService.success(this.editId
          ? 'Mitarbeiter erfolgreich aktualisiert.'
          : 'Mitarbeiter erfolgreich angelegt.');
        this.router.navigate(['/mitarbeiter']);
      },
      error: (e: any) => {
        this.isSaving = false;
        const detail = e?.error?.message
          ?? e?.error?.errors?.[0]?.defaultMessage
          ?? e?.error?.errors?.[0]?.message
          ?? e?.error?.errors?.[0]?.code
          ?? e?.error?.fieldErrors?.[0]?.defaultMessage
          ?? e?.error?.fieldErrors?.[0]?.message
          ?? e?.error?.error
          ?? null;
        if (detail) {
          this.fehler = detail;
          return;
        }

        switch (e?.status) {
          case 403:
            this.fehler = 'Keine Berechtigung: Nur Führungskräfte dürfen Mitarbeitende anlegen oder bearbeiten.';
            break;
          case 409:
            this.fehler = 'Mitarbeiter-ID oder E-Mail ist bereits vergeben.';
            break;
          case 400:
            this.fehler = 'Eingabe ungültig. Bitte Felder und Pflichtangaben prüfen.';
            if (e?.error) {
              try {
                this.fehler += ` Details: ${JSON.stringify(e.error)}`;
              } catch {
                // keine Zusatzdetails verfuegbar
              }
            }
            break;
          case 0:
            this.fehler = 'Verbindung zum Backend nicht möglich. Läuft der Server auf Port 8081?';
            break;
          default:
            this.fehler = this.editId
              ? 'Mitarbeiter konnte nicht aktualisiert werden.'
              : 'Mitarbeiter konnte nicht angelegt werden.';
        }
      }
    });
  }

  private saveWithFallbacks(payloads: Record<string, any>[], index: number): Observable<MitarbeiterResponse> {
    const payload = payloads[index] as MitarbeiterRequest;
    const save$ = this.editId
      ? this.mitarbeiterService.aktualisieren(this.editId, payload)
      : this.mitarbeiterService.anlegen(payload);

    return save$.pipe(
      catchError((err: any) => {
        const canRetry = err?.status === 400 && index < payloads.length - 1;
        if (!canRetry) return throwError(() => err);
        return this.saveWithFallbacks(payloads, index + 1);
      })
    );
  }

  abbrechen(): void {
    this.router.navigate(['/mitarbeiter']);
  }
}

