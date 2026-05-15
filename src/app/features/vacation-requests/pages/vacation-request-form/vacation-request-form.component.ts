import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MitarbeiterResponse, UrlaubsAntragRequest, UrlaubsAntragResponse, Urlaubsart } from '@app/core/models/api.models';
import { FlashMessageService } from '@app/core/services/flash-message.service';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';

@Component({
  selector: 'app-vacation-request-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './vacation-request-form.component.html',
  styleUrls: ['./vacation-request-form.component.scss']
})
export class VacationRequestFormComponent implements OnInit {
  form = this.fb.group({
    startdatum: ['', Validators.required],
    enddatum:   ['', Validators.required],
    urlaubsart: ['ERHOLUNGSURLAUB' as Urlaubsart, Validators.required],
    kommentar:  ['']
  });

  isLoading = false;
  isSaving  = false;
  fehler = '';
  antragId: number | null = null;
  zielMitarbeiterId = '';
  zielMitarbeiter: MitarbeiterResponse | null = null;

  readonly urlaubsarten: Urlaubsart[] = [
    'ERHOLUNGSURLAUB', 'SONDERURLAUB', 'UNBEZAHLTER_URLAUB', 'BILDUNGSURLAUB'
  ];

  readonly urlaubsartLabel: Record<Urlaubsart, string> = {
    ERHOLUNGSURLAUB:  'Erholungsurlaub',
    SONDERURLAUB:     'Sonderurlaub',
    UNBEZAHLTER_URLAUB: 'Unbezahlter Urlaub',
    BILDUNGSURLAUB:   'Bildungsurlaub'
  };

  constructor(
    private fb: FormBuilder,
    private flashMessageService: FlashMessageService,
    private mitarbeiterService: MitarbeiterService,
    private antragService: UrlaubsAntragService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(q => {
      this.zielMitarbeiterId = q.get('mitarbeiterId') ?? '';
      if (this.zielMitarbeiterId) {
        this.ladeMitarbeiter(this.zielMitarbeiterId);
      } else {
        this.zielMitarbeiter = null;
      }
      if (!this.antragId && !this.zielMitarbeiterId) {
        this.fehler = 'Bitte starten Sie einen neuen Urlaubsantrag aus der Mitarbeiterliste.';
      }
    });

    this.route.paramMap.subscribe(p => {
      const id = p.get('id');
      if (id) {
        this.antragId = +id;
        this.laden(this.antragId);
      }
    });
  }

  laden(id: number): void {
    this.isLoading = true;
    this.antragService.findById(id).subscribe({
      next: (a: UrlaubsAntragResponse) => {
        this.zielMitarbeiterId = a.mitarbeiterId;
        this.ladeMitarbeiter(a.mitarbeiterId);
        this.form.patchValue({
          startdatum: a.startdatum,
          enddatum:   a.enddatum,
          urlaubsart: a.urlaubsart,
          kommentar:  a.kommentar ?? ''
        });
        this.isLoading = false;
      },
      error: () => { this.fehler = 'Antrag konnte nicht geladen werden.'; this.isLoading = false; }
    });
  }

  ladeMitarbeiter(id: string): void {
    this.mitarbeiterService.findById(id).subscribe({
      next: (mitarbeiter: MitarbeiterResponse) => {
        this.zielMitarbeiter = mitarbeiter;
      },
      error: () => {
        this.zielMitarbeiter = null;
      }
    });
  }

  speichern(): void {
    if (this.form.invalid) { this.fehler = 'Bitte alle Pflichtfelder ausfüllen.'; return; }
    const { startdatum, enddatum } = this.form.value;
    if (startdatum! > enddatum!) { this.fehler = 'Startdatum muss vor dem Enddatum liegen.'; return; }

    const mitarbeiterId = this.zielMitarbeiterId;
    if (!mitarbeiterId) {
      this.fehler = 'Kein Mitarbeiter gewaehlt. Bitte starten Sie den Vorgang aus der Mitarbeiterliste.';
      return;
    }

    const request: UrlaubsAntragRequest = {
      mitarbeiterId,
      startdatum: this.form.value.startdatum!,
      enddatum:   this.form.value.enddatum!,
      urlaubsart: this.form.value.urlaubsart as Urlaubsart,
      kommentar:  this.form.value.kommentar ?? undefined
    };

    this.isSaving = true;
    this.fehler = '';
    const obs = this.antragId
      ? this.antragService.aktualisieren(this.antragId, request)
      : this.antragService.erstellen(request);

    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.flashMessageService.success(this.antragId
          ? 'Urlaubsantrag erfolgreich aktualisiert.'
          : 'Urlaubsantrag erfolgreich erstellt.');
        this.router.navigate(['/urlaubsantraege']);
      },
      error: (e: any) => {
        this.isSaving = false;
        console.error('Fehler beim Speichern:', e);
        this.fehler = e.error?.message ?? e.message ?? 'Speichern fehlgeschlagen.';
      }
    });
  }

  abbrechen(): void { this.router.navigate(['/urlaubsantraege']); }

  get kannSpeichern(): boolean {
    return this.form.valid && (!!this.zielMitarbeiterId || this.antragId !== null);
  }

  get berechneTage(): number {
    const { startdatum, enddatum } = this.form.value;
    if (!startdatum || !enddatum || startdatum > enddatum) return 0;
    return Math.ceil((new Date(enddatum).getTime() - new Date(startdatum).getTime()) / 86400000) + 1;
  }
}
