import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface QuestTaskView {
  id: string;
  complete: boolean;
  autoClaimed: boolean;
}

export interface QuestPersistedState {
  dayKey: string;
  tasks: Record<string, { progress: number; claimed: boolean }>;
  missionClaimed: boolean;
  weeklyClaimed: boolean;
  totalXp: number;
  pendingMts: number;
}

/** Pas de quêtes Dock sur Review : la progression live reste vide. */
@Injectable({ providedIn: 'root' })
export class QuestsPanelService {
  readonly state$: Observable<QuestPersistedState> = of({
    dayKey: '',
    tasks: {},
    missionClaimed: false,
    weeklyClaimed: false,
    totalXp: 0,
    pendingMts: 0,
  });

  buildTaskViews(_state?: QuestPersistedState): QuestTaskView[] {
    return [];
  }
}
