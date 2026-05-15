import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { MitarbeiterResponse, UrlaubsAntragResponse } from '@app/core/models/api.models';

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

  constructor(
    private antragService: UrlaubsAntragService,
    private mitarbeiterService: MitarbeiterService
  ) {}

  ngOnInit(): void {
    this.ladeMitarbeiter();
    this.laden();
  }

  ladeMitarbeiter(): void {
    this.mitarbeiterService.findAll().subscribe({
      next: (data: MitarbeiterResponse[]) => {
        this.mitarbeiterMap = data.reduce((acc: Record<string, MitarbeiterResponse>, m: MitarbeiterResponse) => {
          acc[m.id] = m;
          return acc;
        }, {});
      },
      error: () => {
        this.mitarbeiterMap = {};
      }
    });
  }

  laden(): void {
    this.isLoading = true;
    // Alle BEANTRAGT-Anträge aller Mitarbeiter laden
    this.antragService.findAll(undefined, 'BEANTRAGT').subscribe({
      next: (data: UrlaubsAntragResponse[]) => {
        this.pendingAntraege = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
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
