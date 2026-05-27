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
    bundesland: ['BE' as Bundesland, Validators.required],
    vorgesetzterMitarbeiterId: ['']
  });

  isLoading = false;
  isSaving = false;
  fehler = '';
  editId: string | null = null;
  readonlySelf = false;
  initialPasswort: string | null = null;

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
      this.readonlySelf = !!(
          this.currentMitarbeiter && id &&
          this.currentMitarbeiter.rolle === 'MITARBEITER' &&
          this.currentMitarbeiter.id === id);

      if (id) {
        // Edit-Modus
        if (!this.readonlySelf) {
          // Nur für Führungskräfte relevant: Felder begrenzen
          this.form.controls.id.disable();
          this.form.controls.rolle.disable({emitEvent: false});
          this.form.controls.vorgesetzterMitarbeiterId.disable({emitEvent: false});
        }
        this.ladeMitarbeiter(id);
      } else {
        this.form.controls.id.enable();
        this.form.patchValue({ rolle: 'MITARBEITER' as Rolle });

        if (this.currentMitarbeiter?.id) {
          this.form.patchValue({ vorgesetzterMitarbeiterId: this.currentMitarbeiter.id });
        }
      }

      this.updateVorgesetzterValidator();
    });
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
        if (this.readonlySelf) {
          this.form.disable({ emitEvent: false });
        }
        this.isLoading = false;
      },
      error: () => {
        this.fehler = 'Mitarbeiter konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  speichern(): void {
    if (this.readonlySelf) {
      return;
    }

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
    const vorgesetzterMitarbeiterId = rawValue.vorgesetzterMitarbeiterId?.trim() || null;

    const request: MitarbeiterRequest = {
      id,
      vorname,
      nachname,
      email,
      rolle: rawValue.rolle as Rolle,
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
        bundesland: request.bundesland,
        vorgesetzterMitarbeiterId: request.vorgesetzterMitarbeiterId
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        bundesland: request.bundesland,
        vorgesetzterMitarbeiterId: request.vorgesetzterMitarbeiterId
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        rolle: request.rolle,
        bundesland: request.bundesland
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        bundesland: request.bundesland
      },
      {
        id: request.id,
        vorname: request.vorname,
        nachname: request.nachname,
        email: request.email,
        rolle: request.rolle,
        bundesland: request.bundesland,
        vorgesetzterId: request.vorgesetzterMitarbeiterId
      }
    ];

    this.isSaving = true;
    this.fehler = '';

    const request$ = this.saveWithFallbacks(payloads, 0);

    request$.subscribe({
      next: (response: MitarbeiterResponse) => {
        this.isSaving = false;

        if (!this.editId && response.initialPasswort) {
          this.initialPasswort = response.initialPasswort;
          this.flashMessageService.successSticky('Mitarbeiter erfolgreich angelegt. Initiales Passwort siehe unten.');
          return;
        }

        this.flashMessageService.success(this.editId ? 'Mitarbeiter erfolgreich aktualisiert.' : 'Mitarbeiter erfolgreich angelegt.');
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

  kopiereInitialPasswort(): void {
    if (!this.initialPasswort) return;
    navigator.clipboard.writeText(this.initialPasswort).then(() => {
      this.flashMessageService.success('Initiales Passwort in die Zwischenablage kopiert.');
    }).catch(() => {
      this.fehler = 'Passwort konnte nicht in die Zwischenablage kopiert werden.';
    });
  }

  weiterZurListe(): void {
    this.initialPasswort = null;
    this.router.navigate(['/mitarbeiter']);
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

