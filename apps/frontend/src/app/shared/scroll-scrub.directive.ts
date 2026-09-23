import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

/**
 * Scrub CSS vars on a tall track with sticky stage.
 * Pattern Awwwards / ScrollTrigger pin+scrub, sans GSAP.
 * --scrub 0→1 + phases --enter / --focus / --reveal / --settle
 * Respecte prefers-reduced-motion (force settle).
 */
@Directive({
  selector: '[appScrollScrub]',
})
export class ScrollScrubDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  private raf = 0;
  private reduced = false;
  private readonly onScroll = () => this.schedule();
  private readonly onResize = () => this.schedule();

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('scroll-scrub');
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) {
      this.apply(1);
      node.classList.add('scroll-scrub--static', 'scroll-scrub--interactive');
      return;
    }
    this.apply(0);
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.schedule();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  private schedule(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.update());
  }

  private update(): void {
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const travel = Math.max(node.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), travel);
    this.apply(scrolled / travel);
  }

  private apply(scrub: number): void {
    const node = this.el.nativeElement;
    const enter = clamp01(scrub / 0.22);
    const focus = clamp01((scrub - 0.18) / 0.32);
    const reveal = clamp01((scrub - 0.48) / 0.28);
    const settle = clamp01((scrub - 0.72) / 0.28);

    node.style.setProperty('--scrub', scrub.toFixed(4));
    node.style.setProperty('--enter', enter.toFixed(4));
    node.style.setProperty('--focus', focus.toFixed(4));
    node.style.setProperty('--reveal', reveal.toFixed(4));
    node.style.setProperty('--settle', settle.toFixed(4));

    node.dataset['scrubPhase'] =
      scrub < 0.22 ? 'enter' : scrub < 0.48 ? 'focus' : scrub < 0.72 ? 'reveal' : 'settle';
    node.classList.toggle('scroll-scrub--interactive', scrub >= 0.52);
  }
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
