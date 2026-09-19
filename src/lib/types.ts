export type PaneType = "terminal" | "file-diff";

export interface PaneState {
  id: string;
  type: PaneType;
  title: string;
  /** Command to spawn instead of the default shell, e.g. "claude" or "opencode". */
  command?: string;
  /** Project directory a file-diff pane is scoped to; defaults to the server's cwd. */
  dir?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
