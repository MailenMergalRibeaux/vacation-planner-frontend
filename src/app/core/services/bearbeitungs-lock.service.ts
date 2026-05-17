import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Hält fest, welche Urlaubsanträge gerade irgendwo (auch in anderen Tabs) zum
 * Bearbeiten geöffnet sind. Detail-Aktionen wie Genehmigen/Ablehnen/Stornieren
 * sollen währenddessen blockiert sein.
 *
 * Persistierung erfolgt in localStorage, damit der Lock zwischen Browser-Tabs
 * sichtbar ist; das storage-Event aktualisiert die übrigen Tabs.
 */
@Injectable({ providedIn: 'root' })
export class BearbeitungsLockService {
  private readonly storageKey = 'urlaubsantragLocks';
  private readonly locksSubject = new BehaviorSubject<Set<number>>(this.loadFromStorage());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.storageKey) {
          this.locksSubject.next(this.loadFromStorage());
        }
      });
    }
  }

  lock(id: number): void {
    if (this.locksSubject.value.has(id)) return;
    const next = new Set(this.locksSubject.value);
    next.add(id);
    this.persist(next);
  }

  unlock(id: number): void {
    if (!this.locksSubject.value.has(id)) return;
    const next = new Set(this.locksSubject.value);
    next.delete(id);
    this.persist(next);
  }

  isLocked(id: number): boolean {
    return this.locksSubject.value.has(id);
  }

  isLocked$(id: number): Observable<boolean> {
    return this.locksSubject.pipe(
      map(set => set.has(id)),
      distinctUntilChanged()
    );
  }

  private persist(next: Set<number>): void {
    this.locksSubject.next(next);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...next]));
    } catch {
      // localStorage nicht verfügbar (z. B. Privatmodus): In-Memory reicht im selben Tab.
    }
  }

  private loadFromStorage(): Set<number> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.map((n: unknown) => Number(n)).filter((n: number) => Number.isFinite(n)));
    } catch {
      return new Set();
    }
  }
}
