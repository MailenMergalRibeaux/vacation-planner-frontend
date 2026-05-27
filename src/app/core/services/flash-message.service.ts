import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FlashMessageType = 'success' | 'error' | 'info';

export interface FlashMessage {
  type: FlashMessageType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private readonly messageSubject = new BehaviorSubject<FlashMessage | null>(null);
  readonly message$ = this.messageSubject.asObservable();
  private hideTimer: any = null;

  success(text: string, autoHideMs = 3500): void {
    this.show({ type: 'success', text }, autoHideMs);
  }

  successSticky(text: string): void {
    this.show({ type: 'success', text }, 0);
  }

  error(text: string, autoHideMs = 4500): void {
    this.show({ type: 'error', text }, autoHideMs);
  }

  info(text: string, autoHideMs = 3500): void {
    this.show({ type: 'info', text }, autoHideMs);
  }

  clear(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.messageSubject.next(null);
  }

  private show(message: FlashMessage, autoHideMs: number): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.messageSubject.next(message);

    if (autoHideMs > 0) {
      this.hideTimer = setTimeout(() => {
        this.messageSubject.next(null);
        this.hideTimer = null;
      }, autoHideMs);
    }
  }
}