import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FlashMessageService } from '@app/core/services/flash-message.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-header></app-header>
      <div class="flash-wrap" *ngIf="flashMessage$ | async as message">
        <div class="flash" [ngClass]="'flash-' + message.type">
          <span>{{ message.text }}</span>
          <button type="button" class="flash-close" (click)="closeFlash()">x</button>
        </div>
      </div>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      padding: 20px 0;
      background-color: #f5f5f5;
    }

    .flash-wrap {
      display: flex;
      justify-content: center;
      padding: 10px 16px 0;
      background-color: #f5f5f5;
    }

    .flash {
      width: min(900px, 100%);
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border: 1px solid transparent;
      font-size: 14px;
    }

    .flash-success {
      background: #e8f5e9;
      color: #1b5e20;
      border-color: #a5d6a7;
    }

    .flash-error {
      background: #ffebee;
      color: #b71c1c;
      border-color: #ef9a9a;
    }

    .flash-info {
      background: #e3f2fd;
      color: #0d47a1;
      border-color: #90caf9;
    }

    .flash-close {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.75;
    }

    .flash-close:hover {
      opacity: 1;
    }
  `]
})
export class LayoutComponent {
  readonly flashMessage$ = this.flashMessageService.message$;

  constructor(private flashMessageService: FlashMessageService) {}

  closeFlash(): void {
    this.flashMessageService.clear();
  }
}
