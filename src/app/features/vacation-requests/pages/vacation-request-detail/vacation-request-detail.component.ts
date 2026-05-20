import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { BearbeitungsLockService } from '@app/core/services/bearbeitungs-lock.service';
import { FlashMessageService } from '@app/core/services/flash-message.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { UrlaubskontoService } from '@app/core/services/urlaubskonto.service';
import { UrlaubskontoRequest, UrlaubsAntragResponse, MitarbeiterResponse } from '@app/core/models/api.models';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';

@Component({
  selector: 'app-vacation-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vacation-request-detail.component.html',
  styleUrls: ['./vacation-request-detail.component.scss']
})
export class VacationRequestDetailComponent implements OnInit, OnDestroy {
  antrag: UrlaubsAntragResponse | null = null;
  isLoading = false;
  isSubmitting = false;
  isCreatingUrlaubskonto = false;
  fehler = '';
  fehlendesUrlaubskonto: { mitarbeiterId: string; jahr: number } | null = null;
  wirdBearbeitet = false;

  currentMitarbeiter: MitarbeiterResponse | null = null;
  istZustaendigeFuehrungskraft = false;

  private lockSubscription?: Subscription;

  constructor(
    private antragService: UrlaubsAntragService,
    private flashMessageService: FlashMessageService,
    private urlaubskontoService: UrlaubskontoService,
    private authService: AuthService,
    private lockService: BearbeitungsLockService,
    private mitarbeiterService: MitarbeiterService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.lockSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.currentMitarbeiter = this.authService.getCurrentMitarbeiter();

    this.route.paramMap.subscribe(p => {
      const id = p.get('id');
      if (id) this.laden(+id);
    });
  }

  laden(id: number): void {
    this.isLoading = true;
    this.antragService.findById(id).subscribe({
      next: (a: UrlaubsAntragResponse) => {
        this.antrag = a;
        this.fehlendesUrlaubskonto = null;
        this.isLoading = false;
        this.beobachteBearbeitungsLock(a.id);
        this.pruefeZustaendigeFuehrungskraft(a);
      },
      error: () => { this.fehler = 'Antrag nicht gefunden.'; this.isLoading = false; }
    });
  }

  private pruefeZustaendigeFuehrungskraft(a: UrlaubsAntragResponse): void {
    const current = this.currentMitarbeiter;
    if (!current || current.rolle !== 'FUEHRUNGSKRAFT') {
      this.istZustaendigeFuehrungskraft = false;
      return;
    }

    this.mitarbeiterService.findById(a.mitarbeiterId).subscribe({
      next: (m) => {
        // FK ist zuständig, wenn sie als Vorgesetzte/r des Mitarbeitenden eingetragen ist
        this.istZustaendigeFuehrungskraft = m.vorgesetzterMitarbeiterId === current.id;
      },
      error: () => {
        this.istZustaendigeFuehrungskraft = false;
      }
    });
  }

  private beobachteBearbeitungsLock(id: number): void {
    this.lockSubscription?.unsubscribe();
    this.lockSubscription = this.lockService.isLocked$(id).subscribe(locked => {
      this.wirdBearbeitet = locked;
    });
  }

  genehmigen(): void {
    if (!this.antrag) return;
    const grund = prompt('Kommentar (optional):') ?? undefined;
    this.isSubmitting = true;
    const jahr = new Date(this.antrag.startdatum).getFullYear();

    // Bei Genehmigung wird in der Regel ein Urlaubskonto benötigt.
    this.urlaubskontoService.findByMitarbeiterUndJahr(this.antrag.mitarbeiterId, jahr).subscribe({
      next: () => {
        this.fehlendesUrlaubskonto = null;
        this.antragService.genehmigen(this.antrag!.id, grund).subscribe({
          next: (a: UrlaubsAntragResponse) => {
            this.antrag = a;
            this.isSubmitting = false;
            this.antragService.notifyOffeneGenehmigungenChanged();
            this.flashMessageService.success('Urlaubsantrag erfolgreich genehmigt.');
          },
          error: (e: any) => { this.fehler = this.formatHttpError(e, 'Genehmigung fehlgeschlagen.'); this.isSubmitting = false; }
        });
      },
      error: (e: any) => {
        const httpError = e as HttpErrorResponse;
        if (httpError.status === 404) {
          this.fehler = `Genehmigung nicht möglich: Urlaubskonto für ${this.antrag!.mitarbeiterId} im Jahr ${jahr} fehlt.`;
          this.fehlendesUrlaubskonto = { mitarbeiterId: this.antrag!.mitarbeiterId, jahr };
        } else {
          this.fehler = this.formatHttpError(e, 'Urlaubskonto konnte nicht geprüft werden.');
          this.fehlendesUrlaubskonto = null;
        }
        this.isSubmitting = false;
      }
    });
  }

  urlaubskontoAnlegen(): void {
    if (!this.fehlendesUrlaubskonto || this.isCreatingUrlaubskonto) return;

    const eingabe = prompt(
      `Gesamturlaubstage für ${this.fehlendesUrlaubskonto.mitarbeiterId} im Jahr ${this.fehlendesUrlaubskonto.jahr}:`,
      '30'
    );
    if (eingabe === null) return;

    const gesamtTage = Number(eingabe);
    if (!Number.isInteger(gesamtTage) || gesamtTage <= 0) {
      this.fehler = 'Ungültige Anzahl Urlaubstage. Bitte eine positive ganze Zahl eingeben.';
      return;
    }

    const request: UrlaubskontoRequest = {
      mitarbeiterId: this.fehlendesUrlaubskonto.mitarbeiterId,
      jahr: this.fehlendesUrlaubskonto.jahr,
      gesamtTage
    };

    this.isCreatingUrlaubskonto = true;
    this.urlaubskontoService.anlegen(request).subscribe({
      next: () => {
        this.isCreatingUrlaubskonto = false;
        this.fehlendesUrlaubskonto = null;
        this.fehler = '';
        this.flashMessageService.success('Urlaubskonto erfolgreich angelegt. Sie können jetzt genehmigen.');
      },
      error: (e: any) => {
        this.isCreatingUrlaubskonto = false;
        this.fehler = this.formatHttpError(e, 'Urlaubskonto anlegen fehlgeschlagen.');
      }
    });
  }

  ablehnen(): void {
    const grund = prompt('Ablehnungsgrund:');
    if (!grund) return;
    this.isSubmitting = true;
    this.antragService.ablehnen(this.antrag!.id, grund).subscribe({
      next: (a: UrlaubsAntragResponse) => {
        this.antrag = a;
        this.isSubmitting = false;
        this.antragService.notifyOffeneGenehmigungenChanged();
      },
      error: (e: any) => { this.fehler = this.formatHttpError(e, 'Ablehnung fehlgeschlagen.'); this.isSubmitting = false; }
    });
  }

  stornieren(): void {
    if (!confirm('Antrag wirklich stornieren?')) return;
    this.isSubmitting = true;
    this.antragService.stornieren(this.antrag!.id).subscribe({
      next: (a: UrlaubsAntragResponse) => {
        this.antrag = a;
        this.isSubmitting = false;
        this.antragService.notifyOffeneGenehmigungenChanged();
      },
      error: (e: any) => { this.fehler = this.formatHttpError(e, 'Stornierung fehlgeschlagen.'); this.isSubmitting = false; }
    });
  }

  private formatHttpError(error: any, fallback: string): string {
    if (error?.error?.message) return error.error.message;
    if (typeof error?.error === 'string' && error.error.trim()) return error.error;
    if (error?.status) return `${fallback} (HTTP ${error.status}).`;
    return error?.message ?? fallback;
  }

  calculateDays(): number {
    if (!this.antrag) return 0;
    return Math.ceil((new Date(this.antrag.enddatum).getTime() - new Date(this.antrag.startdatum).getTime()) / 86400000) + 1;
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = { BEANTRAGT:'Beantragt', GENEHMIGT:'Genehmigt', ABGELEHNT:'Abgelehnt', STORNIERT:'Storniert' };
    return m[s] ?? s;
  }
  statusClass(s: string): string {
    const m: Record<string,string> = { BEANTRAGT:'status-beantragt', GENEHMIGT:'status-genehmigt', ABGELEHNT:'status-abgelehnt', STORNIERT:'status-storniert' };
    return m[s] ?? '';
  }

  // Genehmigen/Ablehnen ist Führungskräften vorbehalten.
  // Solange der Antrag in einer Bearbeitungs-Form geöffnet ist (auch in einem anderen Tab),
  // sind Genehmigen/Ablehnen/Stornieren blockiert.
  kannGenehmigen(): boolean {
    return this.antrag?.status === 'BEANTRAGT'
        && this.istZustaendigeFuehrungskraft
        && !this.wirdBearbeitet;
  }

  kannAblehnen(): boolean {
    return this.antrag?.status === 'BEANTRAGT'
        && this.istZustaendigeFuehrungskraft
        && !this.wirdBearbeitet;
  }

  kannStornieren(): boolean {
    return this.antrag?.status === 'BEANTRAGT'
        && (this.istAntragsteller() || this.istZustaendigeFuehrungskraft)
        && !this.wirdBearbeitet;
  }

  kannBearbeiten(): boolean {
    return this.antrag?.status === 'BEANTRAGT'
        && (this.istAntragsteller() || this.istZustaendigeFuehrungskraft)
        && !this.wirdBearbeitet;
  }

  zurueck(): void { this.router.navigate(['/urlaubsantraege']); }

  private istAntragsteller(): boolean {
    return !!this.antrag
        && !!this.currentMitarbeiter
        && this.antrag.mitarbeiterId === this.currentMitarbeiter.id;
  }
}
