export type PaneType = "terminal";

export interface PaneState {
  id: string;
  type: PaneType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
