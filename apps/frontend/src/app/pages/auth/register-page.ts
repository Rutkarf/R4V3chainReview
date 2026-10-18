import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, DocEyebrow],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/faq');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(this.readError(err, 'Impossible de créer le compte'));
      },
    });
  }

  private readError(err: HttpErrorResponse, fallback: string): string {
    if (typeof err.error === 'object' && err.error && 'message' in err.error) {
      return String((err.error as { message: string }).message);
    }
    if (err.status === 409) {
      return 'Un compte existe déjà avec cet e-mail';
    }
    return fallback;
  }
}
