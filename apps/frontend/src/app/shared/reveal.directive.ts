import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Ajoute .is-revealed au scroll (IntersectionObserver).
 * Respecte prefers-reduced-motion.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-revealed');
      return;
    }
    node.classList.add('reveal');
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add('is-revealed');
          this.observer?.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
