import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { MitarbeiterResponse } from '@app/core/models/api.models';

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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentMitarbeiter$.subscribe((m: MitarbeiterResponse | null) => {
      this.currentMitarbeiter = m;
    });
  }

  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu():  void { this.isMenuOpen = false; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
