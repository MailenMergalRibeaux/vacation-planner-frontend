import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { UrlaubskontoService } from '@app/core/services/urlaubskonto.service';
import { MitarbeiterResponse, UrlaubsAntragResponse, UrlaubskontoResponse } from '@app/core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  mitarbeiter: MitarbeiterResponse | null = null;
  urlaubskonto: UrlaubskontoResponse | null = null;
  antraege: UrlaubsAntragResponse[] = [];
  isLoading = false;
  aktuellesJahr = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private antragService: UrlaubsAntragService,
    private kontoService: UrlaubskontoService
  ) {}

  ngOnInit(): void {
    this.mitarbeiter = this.authService.getCurrentMitarbeiter();
    this.authService.currentMitarbeiter$.subscribe((m: MitarbeiterResponse | null) => {
      this.mitarbeiter = m;
      if (m) this.loadDaten(m.id);
    });
  }

  loadDaten(mitarbeiterId: string): void {
    this.isLoading = true;

    // Anträge laden
    this.antragService.findAll(mitarbeiterId).subscribe({
      next: (antraege: UrlaubsAntragResponse[]) => {
        this.antraege = antraege.slice(0, 5); // Nur die letzten 5
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });

    // Urlaubskonto laden
    this.kontoService.findByMitarbeiterUndJahr(mitarbeiterId, this.aktuellesJahr).subscribe({
      next: (konto: UrlaubskontoResponse) => { this.urlaubskonto = konto; },
      error: () => { this.urlaubskonto = null; }
    });
  }

  get beantragt(): number {
    return this.antraege.filter(a => a.status === 'BEANTRAGT').length;
  }
  get genehmigt(): number {
    return this.antraege.filter(a => a.status === 'GENEHMIGT').length;
  }

  get progressPercent(): number {
    if (!this.urlaubskonto || this.urlaubskonto.gesamtTage <= 0) return 0;
    const wert = (this.urlaubskonto.gebuchteTage / this.urlaubskonto.gesamtTage) * 100;
    return Math.max(0, Math.min(100, wert));
  }

  calculateDays(antrag: UrlaubsAntragResponse): number {
    const start = new Date(antrag.startdatum);
    const end = new Date(antrag.enddatum);
    return Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      BEANTRAGT: 'Beantragt', GENEHMIGT: 'Genehmigt',
      ABGELEHNT: 'Abgelehnt', STORNIERT: 'Storniert'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      BEANTRAGT: 'status-beantragt', GENEHMIGT: 'status-genehmigt',
      ABGELEHNT: 'status-abgelehnt', STORNIERT: 'status-storniert'
    };
    return map[status] ?? '';
  }
}
