import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { FlashMessageService } from '@app/core/services/flash-message.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { UrlaubskontoService } from '@app/core/services/urlaubskonto.service';
import { UrlaubskontoRequest, UrlaubsAntragResponse } from '@app/core/models/api.models';

@Component({
  selector: 'app-vacation-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vacation-request-detail.component.html',
  styleUrls: ['./vacation-request-detail.component.scss']
})
export class VacationRequestDetailComponent implements OnInit {
  antrag: UrlaubsAntragResponse | null = null;
  isLoading = false;
  isSubmitting = false;
  isCreatingUrlaubskonto = false;
  fehler = '';
  fehlendesUrlaubskonto: { mitarbeiterId: string; jahr: number } | null = null;

  constructor(
    private antragService: UrlaubsAntragService,
    private flashMessageService: FlashMessageService,
    private urlaubskontoService: UrlaubskontoService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
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
      },
      error: () => { this.fehler = 'Antrag nicht gefunden.'; this.isLoading = false; }
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
      next: (a: UrlaubsAntragResponse) => { this.antrag = a; this.isSubmitting = false; },
      error: (e: any) => { this.fehler = this.formatHttpError(e, 'Ablehnung fehlgeschlagen.'); this.isSubmitting = false; }
    });
  }

  stornieren(): void {
    if (!confirm('Antrag wirklich stornieren?')) return;
    this.isSubmitting = true;
    this.antragService.stornieren(this.antrag!.id).subscribe({
      next: (a: UrlaubsAntragResponse) => { this.antrag = a; this.isSubmitting = false; },
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

  // Nur Vorgesetzte dürfen genehmigen/ablehnen (vereinfacht: immer true bei admin)
  kannGenehmigen(): boolean { return this.antrag?.status === 'BEANTRAGT'; }
  kannAblehnen():   boolean { return this.antrag?.status === 'BEANTRAGT'; }
  kannStornieren(): boolean { return this.antrag?.status === 'BEANTRAGT'; }
  kannBearbeiten(): boolean { return this.antrag?.status === 'BEANTRAGT'; }

  zurueck(): void { this.router.navigate(['/urlaubsantraege']); }
}
