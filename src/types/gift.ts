export interface JarItem {
  id: string;
  name: string;
  color: number;
}

export type SlotSelection = (JarItem | null)[];

export interface GiftData {
  id: string;
  senderName: string;
  role?: string;
  note: string;
  jarIds: string[];
  createdAt: string;
}

