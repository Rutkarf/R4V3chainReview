import { Component } from '@angular/core';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';
import { R4v3TokenFocus } from '../../shared/r4v3-token-focus/r4v3-token-focus';

@Component({
  selector: 'app-r4v3-page',
  imports: [DocEyebrow, R4v3TokenFocus],
  templateUrl: './r4v3-page.html',
  styleUrl: './r4v3-page.scss',
})
export class R4v3Page {}
