import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { AuthService } from '@app/core/services/auth.service';
import { MitarbeiterResponse, BUNDESLAND_LABELS } from '@app/core/models/api.models';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  istFuehrungskraft = false;
  inviteCode: string | null = null;
  inviteError: string | null = null;
  isInviteLoading = false;

  mitarbeiter: MitarbeiterResponse[] = [];
  isLoading = false;
  readonly bundeslandLabels = BUNDESLAND_LABELS;

  constructor(
    private mitarbeiterService: MitarbeiterService,
    private authService: AuthService
  ) {}

  ngOnInit(): void { this.laden(); }

  laden(): void {
    this.isLoading = true;

    this.resolveCurrentMitarbeiter().subscribe({
      next: (current: MitarbeiterResponse | null) => {
        if (!current) {
          this.mitarbeiter = [];
          this.isLoading = false;
          return;
        }

        this.istFuehrungskraft = current.rolle === 'FUEHRUNGSKRAFT';

        this.mitarbeiterService.findAll(current.id).subscribe({
          next: (team) => {
            // falls das Backend die Führungskraft doch mitliefert, hier zur Sicherheit rausfiltern:
            this.mitarbeiter = team.filter(m => m.id !== current.id);
            this.isLoading = false;
          },
          error: () => {
            this.mitarbeiter = [];
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.mitarbeiter = [];
        this.isLoading = false;
      }
    });
  }

  generateInviteCode(): void {
    if (!this.istFuehrungskraft || this.isInviteLoading) return;

    this.isInviteLoading = true;
    this.inviteError = null;
    this.inviteCode = null;

    this.authService.generateFuehrungskraftInvite().subscribe({
      next: (res) => {
        this.inviteCode = res.code;
        this.isInviteLoading = false;
      },
      error: (err) => {
        this.inviteError =
            err?.error?.message || 'Fehler beim Erzeugen des Einladungscodes.';
        this.isInviteLoading = false;
      }
    });
  }

  private resolveCurrentMitarbeiter(): Observable<MitarbeiterResponse | null> {
    const current = this.authService.getCurrentMitarbeiter();
    if (current) {
      return new Observable<MitarbeiterResponse | null>((subscriber) => {
        subscriber.next(current);
        subscriber.complete();
      });
    }
    if (this.authService.isAuthenticated()) {
      return this.authService.resolveCurrentMitarbeiter();
    }
    return new Observable<MitarbeiterResponse | null>((subscriber) => {
      subscriber.next(null);
      subscriber.complete();
    });
  }

  loeschen(id: string): void {
    if (!confirm('Mitarbeiter wirklich löschen?')) return;
    this.mitarbeiterService.loeschen(id).subscribe({
      next: () => this.laden(),
      error: (e: any) => alert('Fehler: ' + e.error?.message)
    });
  }

  mitarbeiterTooltip(m: MitarbeiterResponse): string {
    return `${m.vorname} ${m.nachname} (${m.email})`;
  }
}
