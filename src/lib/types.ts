export type PaneType = "terminal";

export interface PaneState {
  id: string;
  type: PaneType;
  title: string;
  /** Command to spawn instead of the default shell, e.g. "claude" or "opencode". */
  command?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
