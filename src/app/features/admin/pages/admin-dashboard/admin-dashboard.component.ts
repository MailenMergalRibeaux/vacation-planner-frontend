import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { AuthService } from '@app/core/services/auth.service';
import { FuehrungskraftService } from '@app/core/services/fuehrungskraft.service';
import {
  MitarbeiterResponse,
  UrlaubsAntragResponse,
  FuehrungskraftEinladungResponse
} from '@app/core/models/api.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  pendingAntraege: UrlaubsAntragResponse[] = [];
  mitarbeiterMap: Record<string, MitarbeiterResponse> = {};
  isLoading = false;

  offeneEinladungen: FuehrungskraftEinladungResponse[] = [];
  isLoadingEinladungen = false;

  currentMitarbeiter: MitarbeiterResponse | null = null;

  constructor(
    private antragService: UrlaubsAntragService,
    private mitarbeiterService: MitarbeiterService,
    private fuehrungskraftService: FuehrungskraftService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentMitarbeiter = this.authService.getCurrentMitarbeiter();
    this.ladeMitarbeiter();
    this.ladeOffeneEinladungen();
  }

  ladeMitarbeiter(): void {
    this.mitarbeiterService.findAll().subscribe({
      next: (data: MitarbeiterResponse[]) => {
        this.mitarbeiterMap = data.reduce((acc: Record<string, MitarbeiterResponse>, m: MitarbeiterResponse) => {
          acc[m.id] = m;
          return acc;
        },
        {});
        this.laden();
      },
      error: () => {
        this.mitarbeiterMap = {};
        this.laden();
      }
    });
  }

  ladeOffeneEinladungen(): void {
    if (!this.currentMitarbeiter || this.currentMitarbeiter.rolle !== 'FUEHRUNGSKRAFT') {
      this.offeneEinladungen = [];
      return;
    }

    this.isLoadingEinladungen = true;

    this.fuehrungskraftService.getOffeneEinladungen().subscribe({
      next: (einladungen) => {
        this.offeneEinladungen = einladungen;
        this.isLoadingEinladungen = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der offenen Einladungen', err);
        this.offeneEinladungen = [];
        this.isLoadingEinladungen = false;
      }
    });
  }

  laden(): void {
    // Nur Führungskräfte sehen offene Genehmigungen ihres Teams
    if (!this.currentMitarbeiter || this.currentMitarbeiter.rolle !== 'FUEHRUNGSKRAFT') {
      this.pendingAntraege = [];
      return;
    }

    this.isLoading = true;

    // Alle BEANTRAGT-Anträge aller Mitarbeiter laden
    this.antragService.findAll(undefined, 'BEANTRAGT').subscribe({
      next: (data: UrlaubsAntragResponse[]) => {
        const currentId = this.currentMitarbeiter!.id;

        // Alle direkten Team-Mitglieder der aktuellen Führungskraft
        const teamIds = Object.values(this.mitarbeiterMap)
            .filter((m) => m.vorgesetzterMitarbeiterId === currentId)
            .map((m) => m.id);

        // Offene Anträge NUR dieser Team-Mitglieder, ohne eigene Anträge
        this.pendingAntraege = data.filter(
            (a) => teamIds.includes(a.mitarbeiterId) && a.mitarbeiterId !== currentId);

        this.isLoading = false;
      },
      error: () => {
        this.pendingAntraege = [];
        this.isLoading = false;
      }
    });
  }

  calculateDays(a: UrlaubsAntragResponse): number {
    return Math.ceil((new Date(a.enddatum).getTime() - new Date(a.startdatum).getTime()) / 86400000) + 1;
  }

  mitarbeiterTooltip(mitarbeiterId: string): string {
    const mitarbeiter = this.mitarbeiterMap[mitarbeiterId];
    return mitarbeiter
      ? `${mitarbeiter.vorname} ${mitarbeiter.nachname} (${mitarbeiter.email})`
      : mitarbeiterId;
  }
}
