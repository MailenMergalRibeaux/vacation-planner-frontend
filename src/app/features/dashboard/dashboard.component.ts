import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { UrlaubskontoService } from '@app/core/services/urlaubskonto.service';
import {
  BUNDESLAND_LABELS,
  MitarbeiterResponse,
  Rolle,
  UrlaubsAntragResponse,
  UrlaubskontoResponse
} from '@app/core/models/api.models';

const ROLLE_LABELS: Record<Rolle, string> = {
  MITARBEITER: 'Mitarbeiter:in',
  FUEHRUNGSKRAFT: 'Führungskraft'
};

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
  allAntraege: UrlaubsAntragResponse[] = [];
  letzteAntraege: UrlaubsAntragResponse[] = [];
  isLoading = false;
  aktuellesJahr = new Date().getFullYear();
  private lastLoadedMitarbeiterId: string | null = null;

  constructor(
    private authService: AuthService,
    private antragService: UrlaubsAntragService,
    private kontoService: UrlaubskontoService
  ) {}

  ngOnInit(): void {
    this.authService.currentMitarbeiter$.subscribe((m: MitarbeiterResponse | null) => {
      this.mitarbeiter = m;
      if (m && m.id !== this.lastLoadedMitarbeiterId) {
        this.loadDaten(m.id);
      }
    });

    const currentM = this.authService.getCurrentMitarbeiter();
    if (currentM) {
      this.mitarbeiter = currentM;
      this.loadDaten(currentM.id);
    } else if (this.authService.isAuthenticated()) {
      this.authService.resolveCurrentMitarbeiter().subscribe((m: MitarbeiterResponse | null) => {
        this.mitarbeiter = m;
        if (m) this.loadDaten(m.id);
      });
    }
  }

  loadDaten(mitarbeiterId: string): void {
    this.lastLoadedMitarbeiterId = mitarbeiterId;
    this.isLoading = true;

    // Anträge des aktuellen Mitarbeiters laden
    this.antragService.findAll(mitarbeiterId).subscribe({
      next: (antraege: UrlaubsAntragResponse[]) => {
        this.antraege = antraege;
        this.allAntraege = antraege;
        this.letzteAntraege = antraege
          .sort((a, b) => new Date(b.startdatum).getTime() - new Date(a.startdatum).getTime())
          .slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.antraege = [];
        this.allAntraege = [];
        this.letzteAntraege = [];
        this.isLoading = false;
      }
    });

    this.kontoService.findByMitarbeiterUndJahr(mitarbeiterId, this.aktuellesJahr).subscribe({
      next: (konto: UrlaubskontoResponse) => { this.urlaubskonto = konto; },
      error: () => { this.urlaubskonto = null; }
    });
  }

  get currentMitarbeiterName(): string {
    if (!this.mitarbeiter) return 'Unbekannt';
    return `${this.mitarbeiter.vorname} ${this.mitarbeiter.nachname}`.trim();
  }

  get currentMitarbeiterRolle(): string {
    if (!this.mitarbeiter) return '-';
    return ROLLE_LABELS[this.mitarbeiter.rolle] ?? this.mitarbeiter.rolle;
  }

  get currentMitarbeiterBundesland(): string {
    if (!this.mitarbeiter) return '-';
    return BUNDESLAND_LABELS[this.mitarbeiter.bundesland] ?? this.mitarbeiter.bundesland;
  }

  get beantragt(): number {
    return this.allAntraege.filter(a => a.status === 'BEANTRAGT').length;
  }
  get genehmigt(): number {
    return this.allAntraege.filter(a => a.status === 'GENEHMIGT').length;
  }

  get beantragtGesamt(): number {
    return this.allAntraege.filter(a => {
      const jahr = new Date(a.startdatum).getFullYear();
      return a.status === 'BEANTRAGT' && jahr === this.aktuellesJahr;
    }).length;
  }

  get genehmigtGesamt(): number {
    return this.allAntraege.filter(a => {
      const jahr = new Date(a.startdatum).getFullYear();
      return a.status === 'GENEHMIGT' && jahr === this.aktuellesJahr;
    }).length;
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
