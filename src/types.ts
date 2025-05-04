import { Color, Key } from "chessground/types";
import { Move } from "chess.js";

export interface Puzzle {
  id: number;
  fen: string;
  solution: string[];
  turn: Color;
  description?: string;
}
export interface ChessInstance {
  move: (move: string | { from: Key; to: Key; promotion?: string }) => Move;
  fen: () => string;
  turn: () => "w" | "b";
  moves: (options?: { verbose: boolean }) => Move[];
  undo: () => void;
}
