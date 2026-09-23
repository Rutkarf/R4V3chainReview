import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';

@Component({
  selector: 'app-legal-risques-page',
  imports: [RouterLink, DocEyebrow],
  templateUrl: './legal-risques-page.html',
  styleUrl: './legal-risques-page.scss',
})
export class LegalRisquesPage {}
