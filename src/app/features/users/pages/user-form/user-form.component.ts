import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Bundesland, BUNDESLAND_LABELS, MitarbeiterRequest, MitarbeiterResponse } from '@app/core/models/api.models';
import { FlashMessageService } from '@app/core/services/flash-message.service';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  form = this.fb.group({
    id: ['', [Validators.required, Validators.minLength(2)]],
    vorname: ['', [Validators.required, Validators.minLength(2)]],
    nachname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    bundesland: ['BE' as Bundesland, Validators.required],
    vorgesetzterMitarbeiterId: ['']
  });

  isLoading = false;
  isSaving = false;
  fehler = '';
  editId: string | null = null;

  vorgesetzte: MitarbeiterResponse[] = [];
  readonly bundeslaender = Object.keys(BUNDESLAND_LABELS) as Bundesland[];
  readonly bundeslandLabels = BUNDESLAND_LABELS;

  constructor(
    private fb: FormBuilder,
    private flashMessageService: FlashMessageService,
    private mitarbeiterService: MitarbeiterService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.editId = id;

      if (id) {
        this.form.controls.id.disable();
        this.ladeMitarbeiter(id);
      } else {
        this.form.controls.id.enable();
      }

      this.ladeVorgesetzte();
    });
  }

  ladeVorgesetzte(): void {
    this.isLoading = true;
    this.mitarbeiterService.findAll().subscribe({
      next: (data: MitarbeiterResponse[]) => {
        this.vorgesetzte = this.editId ? data.filter(m => m.id !== this.editId) : data;
        this.isLoading = false;
      },
      error: () => {
        this.fehler = 'Vorgesetzte konnten nicht geladen werden.';
        this.isLoading = false;
      }
    });
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
          bundesland: m.bundesland,
          vorgesetzterMitarbeiterId: m.vorgesetzterMitarbeiterId ?? ''
        });
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
    const request: MitarbeiterRequest = {
      id: rawValue.id!,
      vorname: rawValue.vorname!,
      nachname: rawValue.nachname!,
      email: rawValue.email!,
      bundesland: rawValue.bundesland as Bundesland,
      vorgesetzterMitarbeiterId: rawValue.vorgesetzterMitarbeiterId || null
    };

    this.isSaving = true;
    this.fehler = '';

    const request$ = this.editId
      ? this.mitarbeiterService.aktualisieren(this.editId, request)
      : this.mitarbeiterService.anlegen(request);

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
        this.fehler = e.error?.message ?? (this.editId
          ? 'Mitarbeiter konnte nicht aktualisiert werden.'
          : 'Mitarbeiter konnte nicht angelegt werden.');
      }
    });
  }

  abbrechen(): void {
    this.router.navigate(['/mitarbeiter']);
  }
}

