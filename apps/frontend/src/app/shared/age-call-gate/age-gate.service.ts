import { Injectable, signal } from '@angular/core';

/** Ancienne clé — purgée au boot pour ne plus bloquer un rechargement. */
const LEGACY_STORAGE_KEY = 'dartchain.age.ok.v1';

/** Âge minimum : 21 ans et 3 mois. */
export const MIN_AGE_YEARS = 21;
export const MIN_AGE_MONTHS = 3;

function isHomePath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/';
}

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Appel @R4V3army sur l’accueil uniquement.
 * La session Review (token local) n’est pas effacée.
 *
 * DEV : laisser `false` pour sauter l’appel sans supprimer la scène.
 * Remettre `true` pour rejouer @R4V3army.
 */
export const AGE_CALL_SCENE_ENABLED = true;

@Injectable({ providedIn: 'root' })
export class AgeGateService {
  readonly passed = signal(false);
  readonly active = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    if (!this.shouldAsk()) {
      this.passed.set(true);
      return;
    }
    this.begin();
  }

  shouldAsk(): boolean {
    if (!AGE_CALL_SCENE_ENABLED) return false;
    if (!isHomePath() || reducedMotion()) return false;
    return !this.passed();
  }

  begin(): void {
    if (this.active()) {
      document.documentElement.classList.add('age-gate-active');
      document.body.style.overflow = 'hidden';
      return;
    }
    this.active.set(true);
    document.documentElement.classList.add('age-gate-active');
    document.body.style.overflow = 'hidden';
  }

  markPassed(): void {
    this.passed.set(true);
    this.active.set(false);
  }

  end(): void {
    this.active.set(false);
    document.documentElement.classList.remove('age-gate-active');
    if (!document.documentElement.classList.contains('intro-active')) {
      document.body.style.overflow = '';
    }
  }

  /** Naissance + 21 ans + 3 mois ≤ aujourd’hui. */
  isOldEnough(birthIso: string, now = new Date()): boolean {
    if (!birthIso) return false;
    const birth = new Date(`${birthIso}T12:00:00`);
    if (Number.isNaN(birth.getTime())) return false;
    const unlock = new Date(birth.getTime());
    unlock.setFullYear(unlock.getFullYear() + MIN_AGE_YEARS);
    unlock.setMonth(unlock.getMonth() + MIN_AGE_MONTHS);
    return unlock.getTime() <= now.getTime();
  }
}
