import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@app/core/services/auth.service';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';
import { AntragStatus, MitarbeiterResponse, UrlaubsAntragResponse } from '@app/core/models/api.models';

@Component({
  selector: 'app-vacation-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vacation-request-list.component.html',
  styleUrls: ['./vacation-request-list.component.scss']
})
export class VacationRequestListComponent implements OnInit {
  antraege: UrlaubsAntragResponse[] = [];
  isLoading = false;
  filterStatus: AntragStatus | '' = '';
  mitarbeiterId = '';
  mitarbeiterMap: Record<string, MitarbeiterResponse> = {};

  readonly statusOptions: { value: AntragStatus | '', label: string }[] = [
    { value: '', label: 'Alle' },
    { value: 'BEANTRAGT',  label: 'Beantragt'  },
    { value: 'GENEHMIGT',  label: 'Genehmigt'  },
    { value: 'ABGELEHNT',  label: 'Abgelehnt'  },
    { value: 'STORNIERT',  label: 'Storniert'  },
  ];

  constructor(
    private antragService: UrlaubsAntragService,
    private mitarbeiterService: MitarbeiterService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const m = this.authService.getCurrentMitarbeiter();
    this.mitarbeiterId = m?.id ?? '';
    this.ladeMitarbeiter();
    this.laden();
  }

  ladeMitarbeiter(): void {
    this.mitarbeiterService.findAll().subscribe({
      next: (data: MitarbeiterResponse[]) => {
        this.mitarbeiterMap = data.reduce((acc: Record<string, MitarbeiterResponse>, mitarbeiter: MitarbeiterResponse) => {
          acc[mitarbeiter.id] = mitarbeiter;
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
    const status = this.filterStatus || undefined;
    // Alle Anträge des aktuellen Mitarbeiters laden
    this.antragService.findAll(this.mitarbeiterId || undefined, status).subscribe({
      next: (data: UrlaubsAntragResponse[]) => { this.antraege = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  neuerAntrag(): void { this.router.navigate(['/mitarbeiter']); }

  loeschen(id: number): void {
    if (!confirm('Antrag wirklich löschen?')) return;
    this.antragService.loeschen(id).subscribe({
      next: () => this.laden(),
      error: (e: any) => alert('Löschen fehlgeschlagen: ' + e.error?.message)
    });
  }

  kannLoeschen(a: UrlaubsAntragResponse): boolean  { return a.status === 'BEANTRAGT'; }
  kannBearbeiten(a: UrlaubsAntragResponse): boolean { return a.status === 'BEANTRAGT'; }

  calculateDays(a: UrlaubsAntragResponse): number {
    return Math.ceil((new Date(a.enddatum).getTime() - new Date(a.startdatum).getTime()) / 86400000) + 1;
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = { BEANTRAGT:'Beantragt', GENEHMIGT:'Genehmigt', ABGELEHNT:'Abgelehnt', STORNIERT:'Storniert' };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string,string> = { BEANTRAGT:'status-beantragt', GENEHMIGT:'status-genehmigt', ABGELEHNT:'status-abgelehnt', STORNIERT:'status-storniert' };
    return m[s] ?? '';
  }

  mitarbeiterTooltip(mitarbeiterId: string): string {
    const mitarbeiter = this.mitarbeiterMap[mitarbeiterId];
    return mitarbeiter
      ? `${mitarbeiter.vorname} ${mitarbeiter.nachname} (${mitarbeiter.email})`
      : mitarbeiterId;
  }
}
