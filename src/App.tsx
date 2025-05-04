import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Chessboard from "./Chessboard";
import { Api } from "chessground/api";
import { Config } from "chessground/config";
import { Key, Color } from "chessground/types";
import { Chess } from "chess.js";
import { Puzzle, ChessInstance } from "./types";
import { puzzles } from "./puzzles";
import "./App.css";

const INITIAL_TIME_SECONDS = 60;

function App() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [fen, setFen] = useState<string>("start");
  const [game, setGame] = useState<ChessInstance | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME_SECONDS);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [puzzleActive, setPuzzleActive] = useState<boolean>(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [lastMove, setLastMove] = useState<[Key, Key] | undefined>(undefined);
  const [userTurn, setUserTurn] = useState<Color>("white");

  const cgApiRef = useRef<Api | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setPuzzleActive(false);
      setStatusMessage("Czas minął! Spróbuj ponownie.");
      cgApiRef.current?.set({
        movable: { ...cgApiRef.current?.state.movable, color: undefined },
      });
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // --- Move Handling Logic (bez zmian w logice, tylko używa cgApiRef) ---
  const getValidDests = useCallback(
    (chessInstance: ChessInstance | null): Map<Key, Key[]> | undefined => {
      if (!chessInstance) return undefined;
      const dests = new Map<Key, Key[]>();
      chessInstance.moves({ verbose: true }).forEach((m) => {
        const from = m.from as Key;
        const to = m.to as Key;
        if (dests.has(from)) {
          dests.get(from)?.push(to);
        } else {
          dests.set(from, [to]);
        }
      });
      return dests;
    },
    [],
  );

  useEffect(() => {
    if (!puzzleActive || !game || !currentPuzzle || currentMoveIndex >= currentPuzzle.solution.length) {
      return; 
    }

    const playerColor = currentPuzzle.turn;
    const computerColor = playerColor === 'white' ? 'black' : 'white';
    const isComputersTurnInGame = game.turn() === computerColor[0];

    const isComputersTurnByIndex = currentMoveIndex % 2 === 1;

    if (isComputersTurnInGame && isComputersTurnByIndex) {
       console.log(`useEffect: Scheduling computer move for index ${currentMoveIndex} after delay.`);
        makeComputerMove();
    }
  }, [currentMoveIndex, game, puzzleActive, currentPuzzle]);

  const handleMove = useCallback(
    (from: Key, to: Key) => {
      if (!game || !currentPuzzle || !puzzleActive) return;

      const currentTurnColor = game.turn() === "w" ? "white" : "black";
      if (currentTurnColor !== userTurn) {
        console.warn("Not user's turn");
        return;
      }

      const expectedMove = currentPuzzle.solution[currentMoveIndex];
      const userMove = `${from}${to}`;

      if (userMove === expectedMove) {
        const moveResult = game.move({ from, to });

        if (moveResult) {
          const newFen = game.fen();
          const nextMoveIndex = currentMoveIndex + 1;
          setFen(newFen);
          setLastMove([from, to]);
          setStatusMessage("Dobry ruch!");
          setCurrentMoveIndex(nextMoveIndex);

          if (currentMoveIndex + 1 >= currentPuzzle.solution.length) {
            setStatusMessage("Łamigłówka rozwiązana!");
            setTimerActive(false);
            setPuzzleActive(false);
            handleNextPuzzle();
          }
        } else {
          setStatusMessage("Błąd wykonania ruchu (chess.js).");
        }
      } else {
        setStatusMessage("Zły ruch! Spróbuj ponownie.");
        setTimerActive(false);
        setPuzzleActive(false);
        handleNextPuzzle();
      }
    },
    [game, currentPuzzle, puzzleActive, currentMoveIndex, userTurn],
  );

  const makeComputerMove = useCallback(() => {
    if (
      !game ||
      !currentPuzzle ||
      currentMoveIndex >= currentPuzzle.solution.length
    )
      return;

    const computerMoveStr = currentPuzzle.solution[currentMoveIndex];
    console.log(`makeComputerMove: Attempting move ${computerMoveStr} at index ${currentMoveIndex}`);
    const from = computerMoveStr.substring(0, 2) as Key;
    const to = computerMoveStr.substring(2, 4) as Key;

    const moveResult = game.move({from, to});

    if (moveResult) {
      const newFen = game.fen();
      const nextMoveIndex = currentMoveIndex + 1;
      setFen(newFen);
      setLastMove([from, to]);
      setCurrentMoveIndex(nextMoveIndex);
      const nextTurnColor = game.turn() === "w" ? "white" : "black";
      setUserTurn(nextTurnColor);

      if (nextMoveIndex >= currentPuzzle.solution.length) {
        setTimerActive(false);
        setPuzzleActive(false);
      } else {
        setStatusMessage("Poprawny ruch, kontynuuj!");
      }
    } else {
      console.error("Błąd wykonania ruchu komputera:", computerMoveStr);
      setStatusMessage("Błąd wewnętrzny łamigłówki.");
      setPuzzleActive(false);
      setTimerActive(false);
    }
  }, [game, currentPuzzle, currentMoveIndex]);

  const loadPuzzle = useCallback(
    (index: number) => {
      if (index >= 0 && index < puzzles.length) {
        const puzzle = puzzles[index];
        const chessInstance = new Chess(puzzle.fen) as ChessInstance;

        setCurrentPuzzle(puzzle);
        setGame(chessInstance);
        setFen(puzzle.fen);
        setStatusMessage(
          `${puzzle.turn === "white" ? "Białe" : "Czarne"} zaczynają. ${
            puzzle.description || ""
          }`,
        );
        setTimerActive(true);
        setPuzzleActive(true);
        setCurrentMoveIndex(0);
        setLastMove(undefined);
        setUserTurn(puzzle.turn);
        setCurrentPuzzleIndex(index);
      } else {
        setStatusMessage("Wszystkie łamigłówki rozwiązane!");
        setPuzzleActive(false);
        setTimerActive(false);
        setCurrentPuzzle(null);
      }
    },
    [],
  );

  useEffect(() => {
    loadPuzzle(0);
    setTimeLeft(INITIAL_TIME_SECONDS);
  }, [loadPuzzle]);

  const handleBoardReady = useCallback((api: Api) => {
    console.log("Chessground API Ready:", api);
    cgApiRef.current = api;
  }, []);

  const puzzleTurn = currentPuzzle?.turn;
  const gameTurn = game?.turn();

  const cgConfig: Config = useMemo(() => {
    const dests = puzzleActive ? getValidDests(game) : undefined;   

    return {
      fen: fen,
      orientation: puzzleTurn || "white",
      turnColor: gameTurn === "w" ? "white" : "black",
      lastMove: lastMove,
      movable: {
        free: false,
        color: puzzleActive ? userTurn : undefined,
        dests: dests,
        showDests: true,
        events: {
          after: handleMove,
        },
      },
      highlight: {
        lastMove: true,
        check: true,
      },
      animation: {
        enabled: true,
        duration: 200,
      },
      viewOnly: !puzzleActive,
      coordinates: true,
    };
  }, [
    fen,
    puzzleTurn,
    gameTurn,
    lastMove,
    puzzleActive,
    userTurn,
    getValidDests,
    handleMove,
    game,
  ]);

  const handleNextPuzzle = () => {
    loadPuzzle(currentPuzzleIndex + 1);
  };

  const handleRetryPuzzle = () => {
    loadPuzzle(currentPuzzleIndex);
  };

  return (
    <div className="app-container">
      <h1>chess custom puzzle storm</h1>

      <div className="timer">{formatTime(timeLeft)}</div>

      <div className="status">
        <span
          className={
            statusMessage.includes("Dobry") ||
            statusMessage.includes("rozwiązana")
              ? "correct"
              : statusMessage.includes("Zły") || statusMessage.includes("Czas")
              ? "incorrect"
              : ""
          }
        >
          {statusMessage}
        </span>
      </div>

      {currentPuzzle && game ? (
        <Chessboard
          key={currentPuzzleIndex}
          config={cgConfig}
          onBoardReady={handleBoardReady}
        />
      ) : (
        <div className="board-container-default">
          Loading puzzle...
        </div>
      )}

      <div className="controls">
        <button onClick={handleRetryPuzzle} disabled={!currentPuzzle}>
          Spróbuj Ponownie
        </button>
        <button
          onClick={handleNextPuzzle}
          disabled={currentPuzzleIndex >= puzzles.length - 1}
        >
          Następna Łamigłówka
        </button>
      </div>
    </div>
  );
}

export default App;
