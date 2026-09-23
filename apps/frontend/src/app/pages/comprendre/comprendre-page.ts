import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocEyebrow } from '../../shared/doc-eyebrow/doc-eyebrow';

@Component({
  selector: 'app-comprendre-page',
  imports: [RouterLink, DocEyebrow],
  templateUrl: './comprendre-page.html',
  styleUrl: './comprendre-page.scss',
})
export class ComprendrePage {}
