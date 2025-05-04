import { Puzzle } from "./types";

export const puzzles: Puzzle[] = [
  {
    id: 1,
    fen: "r2b2k1/5p1p/p4p2/4p2q/4N3/7P/P1Q2PP1/3R2K1 w - - 0 1",
    solution: ["d1d8", "g8g7", "d8a8"],
    turn: "white",
    description: "Prosty pierwszy ruch.",
  },
  {
    id: 2,
    fen: "r2b2k1/5p1p/p4p2/4p2q/4N3/7P/P1Q2PP1/3R2K1 w - - 0 1",
    solution: ["d1d8", "a8d8", "e4f6"],
    turn: "white",
    description: "Prosty pierwszy ruch.",
  },
  {
    id: 3,
    fen: "8/8/8/8/k1K5/8/8/1R6 w - - 0 1",
    solution: ["b1a1"],
    turn: "white",
    description: "Mat w jednym ruchu.",
  },
  {
    id: 4,
    fen: "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 3",
    solution: ["f3d4", "c5d4"],
    turn: "white",
    description: "Prosta wymiana.",
  },
];
