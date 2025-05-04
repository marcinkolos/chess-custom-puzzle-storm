import React, { useEffect, useRef } from "react";
import { Chessground } from "chessground";
import { Api } from "chessground/api";
import { Config } from "chessground/config";
import "./Chessboard.css";
import "../node_modules/chessground/assets/chessground.base.css";
import "../node_modules/chessground/assets/chessground.brown.css";
import "../node_modules/chessground/assets/chessground.cburnett.css";

interface ChessboardProps {
  config: Config;
  onBoardReady: (api: Api) => void;
  className?: string;
}

function ChessboardComponent({ config, onBoardReady, className }: ChessboardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cgApiRef = useRef<Api | null>(null);

  useEffect(() => {
    if (ref.current && !cgApiRef.current) {
      const api = Chessground(ref.current, config);
      cgApiRef.current = api;
      onBoardReady(api);
    }

    return () => {
      cgApiRef.current?.destroy();
      cgApiRef.current = null;
    };
  }, [onBoardReady]);

  useEffect(() => {
    if (cgApiRef.current) {
      cgApiRef.current.set(config);
      console.log("Chessboard: State after applying config:", cgApiRef.current.state);
    }
  }, [config]);

  return (
    <div className={className || "board-container-default"}>
      <div
        ref={ref}
        style={{ height: "100%", width: "100%", display: "table" }}
      ></div>
    </div>
  );
}

const Chessboard = React.memo(ChessboardComponent);
export default Chessboard;
