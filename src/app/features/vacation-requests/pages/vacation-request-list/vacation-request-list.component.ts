import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
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
  mitarbeiter: MitarbeiterResponse | null = null;
  mitarbeiterMap: Record<string, MitarbeiterResponse> = {};
  istFuehrungskraft = false;
  private teamIds = new Set<string>();
  private geladenFuerMitarbeiterId = '';

  zeigeNurEigene = false;
  private eigeneAntraege: UrlaubsAntragResponse[] = [];
  private teamAntraege: UrlaubsAntragResponse[] = [];

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
    if (m) {
      this.uebernehmeMitarbeiter(m);
    } else if (this.authService.isAuthenticated()) {
      this.authService.resolveCurrentMitarbeiter().subscribe({
        next: (resolved) => { if (resolved) this.uebernehmeMitarbeiter(resolved); }
      });
    }

    this.authService.currentMitarbeiter$.subscribe((current: MitarbeiterResponse | null) => {
      if (current && current.id !== this.mitarbeiter?.id) {
        this.uebernehmeMitarbeiter(current);
      }
    });
  }

  private uebernehmeMitarbeiter(m: MitarbeiterResponse): void {
    this.mitarbeiter = m;
    this.istFuehrungskraft = m.rolle === 'FUEHRUNGSKRAFT';
    if (this.geladenFuerMitarbeiterId !== m.id) {
      this.laden();
    }
  }

  laden(): void {
    if (!this.mitarbeiter) return;
    const aktueller = this.mitarbeiter;
    this.isLoading = true;
    this.geladenFuerMitarbeiterId = aktueller.id;
    const status = this.filterStatus || undefined;

    const stream$: Observable<{ antraege: UrlaubsAntragResponse[]; team: MitarbeiterResponse[] }> =
      this.istFuehrungskraft
        ? forkJoin({
            antraege: this.antragService.findAll(undefined, status),
            team: this.mitarbeiterService.findAll(aktueller.id)
          })
        : forkJoin({
            antraege: this.antragService.findAll(aktueller.id, status),
            team: of<MitarbeiterResponse[]>([aktueller])
          });

    stream$.subscribe({
      next: ({ antraege, team }) => {
        this.mitarbeiterMap = team.reduce((acc, mitarbeiter) => {
          acc[mitarbeiter.id] = mitarbeiter;
          return acc;
        }, {} as Record<string, MitarbeiterResponse>);
        this.teamIds = new Set(team.map(t => t.id));

        if (this.istFuehrungskraft) {
          const ownId = aktueller.id;

          // eigene Anträge der Führungskraft
          this.eigeneAntraege = antraege.filter(a => a.mitarbeiterId === ownId);

          // Team-Anträge (ohne eigene)
          this.teamAntraege = antraege.filter(
              a => this.teamIds.has(a.mitarbeiterId) && a.mitarbeiterId !== ownId
          );

          this.refreshGefilterteAntraege();
        } else {
          // Mitarbeiter: einfach eigene Anträge
          this.antraege = antraege;
        }

        this.isLoading = false;
      },
      error: () => {
        this.antraege = [];
        this.isLoading = false;
      }
    });
  }

  // NEU: Anzeige je nach Toggle aktualisieren
  private refreshGefilterteAntraege(): void {
    if (!this.istFuehrungskraft) return;

    // Nur eigene ODER nur Team-Anträge – nicht beides gleichzeitig
    this.antraege = this.zeigeNurEigene
        ? this.eigeneAntraege // Meine Urlaubsanträge
        : this.teamAntraege; // Urlaubsanträge meines Teams
  }

  // NEU: Toggle-Methode fürs Template
  toggleNurEigene(): void {
    this.zeigeNurEigene = !this.zeigeNurEigene;
    this.refreshGefilterteAntraege();
  }

  get listenTitel(): string {
    if (!this.istFuehrungskraft || this.zeigeNurEigene) {
      return 'Meine Urlaubsanträge';
    }
    return 'Urlaubsanträge meines Teams';
  }

  get leerMeldung(): string {
    if (!this.istFuehrungskraft || this.zeigeNurEigene) {
      return 'Du hast aktuell keine Urlaubsanträge.';
    }
    return 'Es liegen aktuell keine Urlaubsanträge deines Teams vor.';
  }

  neuerAntrag(): void {
    if (this.istFuehrungskraft) {
      if (this.zeigeNurEigene) {
        this.router.navigate(['/urlaubsantraege', 'neu'], {queryParams: { mitarbeiterId: this.geladenFuerMitarbeiterId }});
      } else {
        this.router.navigate(['/mitarbeiter']);
        return;
      }
    }
    if (this.mitarbeiter) {
      this.router.navigate(['/urlaubsantraege', 'neu'], {
        queryParams: { mitarbeiterId: this.mitarbeiter.id }
      });
    }
  }

  get neuerAntragLabel(): string {
    return !this.istFuehrungskraft || this.zeigeNurEigene
        ? 'Antrag stellen' : '+ Mitarbeiter für Antrag wählen';
  }

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
    const m = this.mitarbeiterMap[mitarbeiterId];
    return m ? `${m.vorname} ${m.nachname} (${m.email})` : mitarbeiterId;
  }

  mitarbeiterLabel(mitarbeiterId: string): string {
    const m = this.mitarbeiterMap[mitarbeiterId];
    return m ? `${m.vorname} ${m.nachname}` : mitarbeiterId;
  }

  kannMitarbeiterBearbeiten(a: UrlaubsAntragResponse): boolean {
    if (!this.mitarbeiter) {
      return false;
    }

    // Führungskraft: darf immer auf Mitarbeiter bearbeiten
    return this.istFuehrungskraft || a.mitarbeiterId === this.mitarbeiter.id;
  }
}
