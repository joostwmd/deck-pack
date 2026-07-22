export type ShortcutOverrideRow = {
  shortcutId: string;
  hotkey: string;
  schemaVersion: number;
  updatedAt?: Date;
};

export type UpsertShortcutOverrideInput = {
  userId: string;
  shortcutId: string;
  hotkey: string;
  schemaVersion: number;
};
