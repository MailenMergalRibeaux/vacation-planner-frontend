import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MitarbeiterService } from '@app/core/services/mitarbeiter.service';
import { MitarbeiterResponse, BUNDESLAND_LABELS } from '@app/core/models/api.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  mitarbeiter: MitarbeiterResponse[] = [];
  mitarbeiterMap: Record<string, MitarbeiterResponse> = {};
  isLoading = false;
  readonly bundeslandLabels = BUNDESLAND_LABELS;

  constructor(private mitarbeiterService: MitarbeiterService) {}

  ngOnInit(): void { this.laden(); }

  laden(): void {
    this.isLoading = true;
    this.mitarbeiterService.findAll().subscribe({
      next: (data: MitarbeiterResponse[]) => {
        this.mitarbeiter = data;
        this.mitarbeiterMap = data.reduce((acc: Record<string, MitarbeiterResponse>, m: MitarbeiterResponse) => {
          acc[m.id] = m;
          return acc;
        }, {});
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
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

  vorgesetzterTooltip(vorgesetzterId?: string | null): string {
    if (!vorgesetzterId) return 'Kein Vorgesetzter';
    const vorgesetzter = this.mitarbeiterMap[vorgesetzterId];
    return vorgesetzter
      ? `${vorgesetzter.vorname} ${vorgesetzter.nachname} (${vorgesetzter.email})`
      : vorgesetzterId;
  }
}
