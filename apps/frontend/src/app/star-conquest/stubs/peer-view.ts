export type PeerStatus = 'connected' | 'degraded' | 'offline' | string;

/** Sous-ensemble utilisé par le graphe, sans le client blockchain du hub. */
export interface PeerView {
  url: string;
  status: PeerStatus;
  message: string;
  latencyMs?: number | null;
  chainHeight?: number | null;
  localChainHeight?: number | null;
  syncPercent?: number | null;
  lastSyncAt?: string | null;
  activityPoints?: readonly number[] | null;
}
