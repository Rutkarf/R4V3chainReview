import { Injectable, signal } from '@angular/core';
import type { PeerView } from './peer-view';

/** Review n’a pas le réseau P2P du hub : le ciel reste le catalogue de quêtes. */
@Injectable({ providedIn: 'root' })
export class PeersDataService {
  private readonly peerList = signal<readonly PeerView[]>([]);

  peers(): readonly PeerView[] {
    return this.peerList();
  }

  init(): void {}
}
