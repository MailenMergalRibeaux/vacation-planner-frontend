import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InactivityService {
    private timeoutId: any;
    private countdownIntervalId: any;
    private readonly INACTIVITY_MS = 15 * 60_000; // 15 Minute

    private remainingSecondsSubject = new BehaviorSubject<number>(this.INACTIVITY_MS / 1000);
    readonly remainingSeconds$ = this.remainingSecondsSubject.asObservable();

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    initListener(): void {
        ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            window.addEventListener(event, () => this.resetTimer());
        });
        this.resetTimer();
    }

    private resetTimer(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.countdownIntervalId) {
            clearInterval(this.countdownIntervalId);
        }

        const totalSeconds = this.INACTIVITY_MS / 1000;
        this.remainingSecondsSubject.next(totalSeconds);

        // Timer für tatsächlichen Logout
        this.timeoutId = setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login'], {
                queryParams: { reason: 'timeout' },
            });
        }, this.INACTIVITY_MS);

        // Sekündlicher Countdown
        this.countdownIntervalId = setInterval(() => {
            const current = this.remainingSecondsSubject.value;
            if (current <= 1) {
                clearInterval(this.countdownIntervalId);
                this.countdownIntervalId = null;
                this.remainingSecondsSubject.next(0);
            } else {
                this.remainingSecondsSubject.next(current - 1);
            }
        }, 1000);
    }
}