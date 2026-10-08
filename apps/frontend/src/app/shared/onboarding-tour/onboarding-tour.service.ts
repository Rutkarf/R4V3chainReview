import { Injectable, signal } from '@angular/core';

export interface TourEntryPose {
  x: number;
  y: number;
  size: number;
}

/**
 * Review n’embarque pas le tutoriel hub DartChain.
 * `shouldStart()` reste faux : Feed The R4V3 enchaîne le vol vers le header.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingTourService {
  readonly active = signal(false);

  shouldStart(): boolean {
    return false;
  }

  start(): boolean {
    return false;
  }

  seedEntryPose(_pose: TourEntryPose): void {}

  clearEntryPose(): void {}
}
