import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { MitarbeiterResponse, UrlaubsAntragResponse } from '@app/core/models/api.models';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { UrlaubsAntragService } from '@app/core/services/urlaubsantrag.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentMitarbeiter: MitarbeiterResponse | null = null;
  isMenuOpen = false;

  offeneGenehmigungenCount = 0;
  isLoadingOffeneGenehmigungen = false;
  mitarbeiterMap: Record<string, MitarbeiterResponse> = {};

  constructor(
      private authService: AuthService,
      private mitarbeiterService: MitarbeiterService,
      private urlaubsAntragService: UrlaubsAntragService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentMitarbeiter$.subscribe((m: MitarbeiterResponse | null) => {
      this.currentMitarbeiter = m;
      this.ladeOffeneGenehmigungen();
    });

    // Bei jeder Änderung an offenen Genehmigungen neu laden
    this.urlaubsAntragService.offeneGenehmigungenChanged$.subscribe(() => {
      this.ladeOffeneGenehmigungen();
    });
  }

  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu():  void { this.isMenuOpen = false; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private ladeOffeneGenehmigungen(): void {
    // Nur Führungskräfte haben offene Genehmigungen für ihr Team
    if (!this.currentMitarbeiter || this.currentMitarbeiter.rolle !== 'FUEHRUNGSKRAFT') {
      this.offeneGenehmigungenCount = 0;
      return;
    }

    this.isLoadingOffeneGenehmigungen = true;

    // 1. Alle Mitarbeitenden laden, um Team-Mitglieder zu finden
    this.mitarbeiterService.findAll().subscribe({
      next: (mitarbeiter: MitarbeiterResponse[]) => {
        this.mitarbeiterMap = mitarbeiter.reduce(
            (acc: Record<string, MitarbeiterResponse>, m: MitarbeiterResponse) => {
              acc[m.id] = m;
              return acc;
            },
            {}
        );

        const fkId = this.currentMitarbeiter!.id;
        const teamIds = Object.values(this.mitarbeiterMap)
            .filter((m) => m.vorgesetzterMitarbeiterId === fkId)
            .map((m) => m.id);

        // 2. Alle BEANTRAGT-Anträge holen und auf Team filtern
        this.urlaubsAntragService.findAll(undefined, 'BEANTRAGT').subscribe({
          next: (antraege: UrlaubsAntragResponse[]) => {
            const teamAntraege = antraege.filter(
                (a) => teamIds.includes(a.mitarbeiterId) && a.mitarbeiterId !== fkId
            );

            this.offeneGenehmigungenCount = teamAntraege.length;
            this.isLoadingOffeneGenehmigungen = false;
          },
          error: () => {
            this.offeneGenehmigungenCount = 0;
            this.isLoadingOffeneGenehmigungen = false;
          }
        });
      },
      error: () => {
        this.offeneGenehmigungenCount = 0;
        this.isLoadingOffeneGenehmigungen = false;
      }
    });
  }
}
