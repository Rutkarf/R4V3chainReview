import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';
import { LANDING_FAQ, FaqItem } from '../home/landing-faq.data';
import { AuthService } from '../../core/auth.service';
import { FaqApiService, FaqQuestion } from '../../core/faq-api.service';

@Component({
  selector: 'app-faq-page',
  imports: [RouterLink, DocEyebrow, ReactiveFormsModule],
  templateUrl: './faq-page.html',
  styleUrl: './faq-page.scss',
})
export class FaqPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly faqApi = inject(FaqApiService);

  protected readonly faq = LANDING_FAQ;
  protected readonly openFaqId = signal<string | null>(null);
  protected readonly communityQuestions = signal<FaqQuestion[]>([]);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitOk = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(220)]],
    body: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(4000)]],
  });

  ngOnInit(): void {
    this.reloadCommunity();
  }

  protected toggleFaq(item: FaqItem): void {
    this.openFaqId.update((id) => (id === item.id ? null : item.id));
  }

  protected isOpen(id: string): boolean {
    return this.openFaqId() === id;
  }

  protected submitQuestion(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitOk.set(false);
    this.faqApi.submit(this.form.getRawValue()).subscribe({
      next: (q) => {
        this.submitting.set(false);
        this.submitOk.set(true);
        this.form.reset();
        this.communityQuestions.update((list) => [q, ...list]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.submitError.set(
          err.status === 401
            ? 'Connectez-vous pour soumettre une question'
            : 'Envoi impossible — réessayez plus tard',
        );
      },
    });
  }

  private reloadCommunity(): void {
    this.faqApi.list().subscribe({
      next: (list) => this.communityQuestions.set(list),
      error: () => this.communityQuestions.set([]),
    });
  }
}
