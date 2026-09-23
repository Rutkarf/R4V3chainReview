import { Injectable, signal } from '@angular/core';

/**
 * Intro plein écran type AMIX. Home uniquement ; l’insert attend le clic INSERT R4V3.
 */
@Injectable({ providedIn: 'root' })
export class IntroService {
  readonly playing = signal(false);
  readonly finished = signal(false);

  shouldPlay(url: string): boolean {
    const path = url.split('?')[0];
    if (path !== '/' && path !== '') return false;
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }

  begin(): void {
    this.finished.set(false);
    this.playing.set(true);
    document.documentElement.classList.add('intro-active');
    document.documentElement.classList.remove('intro-done', 'intro-reveal');
    document.body.style.overflow = 'hidden';
  }

  /** Laisse voir le hero (titre) pendant que le token recule. */
  revealPage(): void {
    document.documentElement.classList.add('intro-reveal');
  }

  /** Header visible pour l’atterrissage haut-gauche. */
  revealHeader(): void {
    document.documentElement.classList.add('intro-fly');
  }

  complete(): void {
    if (this.finished()) return;
    this.playing.set(false);
    this.finished.set(true);
    document.documentElement.classList.remove('intro-active', 'intro-reveal', 'intro-fly');
    document.documentElement.classList.add('intro-done');
    document.body.style.overflow = '';
  }

  skipMark(): void {
    this.finished.set(true);
    document.documentElement.classList.remove('intro-active', 'intro-reveal', 'intro-fly');
    document.documentElement.classList.add('intro-done');
    document.body.style.overflow = '';
  }
}
