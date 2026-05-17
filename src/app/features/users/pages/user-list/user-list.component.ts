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

        forkJoin({
          self: this.mitarbeiterService.findById(current.id),
          team: this.mitarbeiterService.findAll(current.id)
        }).subscribe({
          next: ({ self, team }) => {
            const map = new Map<string, MitarbeiterResponse>();
            map.set(self.id, self);
            team.forEach((m) => map.set(m.id, m));
            this.mitarbeiter = Array.from(map.values());
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
