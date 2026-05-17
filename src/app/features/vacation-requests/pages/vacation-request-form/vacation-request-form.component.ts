import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AntragStatus, MitarbeiterResponse, UrlaubsAntragRequest, UrlaubsAntragResponse, Urlaubsart } from '@app/core/models/api.models';
import { BearbeitungsLockService } from '@app/core/services/bearbeitungs-lock.service';
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
export class VacationRequestFormComponent implements OnInit, OnDestroy {
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
  antragStatus: AntragStatus | null = null;
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
    private lockService: BearbeitungsLockService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    if (this.antragId !== null) {
      this.lockService.unlock(this.antragId);
    }
  }

  ngOnInit(): void {
    // Bearbeitungs-ID synchron aus dem Snapshot lesen, bevor queryParamMap feuert –
    // sonst würde sonst kurzzeitig fälschlich "Bitte aus Mitarbeiterliste starten" erscheinen.
    const idAusUrl = this.route.snapshot.paramMap.get('id');
    if (idAusUrl) {
      this.antragId = +idAusUrl;
      this.lockService.lock(this.antragId);
      this.laden(this.antragId);
    }

    this.route.queryParamMap.subscribe(q => {
      const ziel = q.get('mitarbeiterId') ?? '';
      this.zielMitarbeiterId = ziel;
      if (ziel) {
        this.ladeMitarbeiter(ziel);
      } else if (!this.antragId) {
        this.zielMitarbeiter = null;
      }
      if (!this.antragId && !ziel) {
        this.fehler = 'Bitte starten Sie einen neuen Urlaubsantrag aus der Mitarbeiterliste.';
      }
    });
  }

  laden(id: number): void {
    this.isLoading = true;
    this.fehler = '';
    this.antragService.findById(id).subscribe({
      next: (a: UrlaubsAntragResponse) => {
        this.antragStatus = a.status;
        this.zielMitarbeiterId = a.mitarbeiterId;
        this.ladeMitarbeiter(a.mitarbeiterId);
        this.form.patchValue({
          startdatum: a.startdatum,
          enddatum:   a.enddatum,
          urlaubsart: a.urlaubsart,
          kommentar:  a.kommentar ?? ''
        });
        if (this.bearbeitungGesperrt) {
          this.form.disable();
          this.fehler = `Antrag mit Status "${this.statusLabel(a.status)}" kann nicht mehr bearbeitet werden. Nur Anträge mit Status "Beantragt" sind änderbar.`;
        } else {
          this.form.enable();
        }
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
    if (this.bearbeitungGesperrt) { return; }
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
    return this.form.valid
      && (!!this.zielMitarbeiterId || this.antragId !== null)
      && !this.bearbeitungGesperrt;
  }

  get bearbeitungGesperrt(): boolean {
    return this.antragStatus !== null && this.antragStatus !== 'BEANTRAGT';
  }

  private statusLabel(s: AntragStatus): string {
    const m: Record<AntragStatus, string> = {
      BEANTRAGT: 'Beantragt', GENEHMIGT: 'Genehmigt',
      ABGELEHNT: 'Abgelehnt', STORNIERT: 'Storniert'
    };
    return m[s];
  }

  get berechneTage(): number {
    const { startdatum, enddatum } = this.form.value;
    if (!startdatum || !enddatum || startdatum > enddatum) return 0;
    return Math.ceil((new Date(enddatum).getTime() - new Date(startdatum).getTime()) / 86400000) + 1;
  }
}
