import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board.jsx';
import GameModeSelector from './GameModeSelector.jsx';
import MLTrainer from './MLTrainer.jsx';
import { checkWinner, isBoardFull, getBestMove } from '../utils/minimax.js';
import MLAI from '../utils/mlAI.js';
import './Game.css';

const Game = () => {
  const navigate = useNavigate();
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState('human-vs-human');
  const [gameStarted, setGameStarted] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000);
  const [showMLTrainer, setShowMLTrainer] = useState(false);
  const [mlAI, setMlAI] = useState(null);

  const winner = checkWinner(squares);
  const isDraw = !winner && isBoardFull(squares);
  const gameOver = winner || isDraw;

  const getWinningLine = () => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return line;
      }
    }
    return null;
  };

  const handleSquareClick = (i) => {
    if (squares[i] || gameOver) return;

    if (gameMode === 'human-vs-human' || 
        (gameMode === 'human-vs-bot' && xIsNext)) {
      const newSquares = squares.slice();
      newSquares[i] = xIsNext ? 'X' : 'O';
      setSquares(newSquares);
      setXIsNext(!xIsNext);
    }
  };

  const makeBotMove = () => {
    if (gameOver) return;

    let move = null;
    
    // Use ML AI if available and trained, otherwise use minimax
    if (mlAI && mlAI.getStats().gamesPlayed > 0) {
      move = mlAI.makeMove(squares, 'O');
    } else {
      move = getBestMove(squares);
    }
    
    if (move !== null) {
      const newSquares = squares.slice();
      newSquares[move] = 'O';
      setSquares(newSquares);
      setXIsNext(true);
    }
  };

  const makeRandomMove = () => {
    if (gameOver) return;

    const availableMoves = squares
      .map((square, index) => square === null ? index : null)
      .filter(index => index !== null);

    if (availableMoves.length > 0) {
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      const newSquares = squares.slice();
      newSquares[randomMove] = xIsNext ? 'X' : 'O';
      setSquares(newSquares);
      setXIsNext(!xIsNext);
    }
  };

  // Bot vs Bot auto-play
  useEffect(() => {
    if (gameMode === 'bot-vs-bot' && gameStarted && !gameOver) {
      const timer = setTimeout(() => {
        if (xIsNext) {
          // X plays randomly or with ML AI if available
          if (mlAI && mlAI.getStats().gamesPlayed > 0) {
            const move = mlAI.makeMove(squares, 'X');
            if (move !== null) {
              const newSquares = squares.slice();
              newSquares[move] = 'X';
              setSquares(newSquares);
              setXIsNext(false);
            }
          } else {
            makeRandomMove(); // X plays randomly
          }
        } else {
          makeBotMove(); // O plays optimally
        }
      }, autoPlaySpeed);
      return () => clearTimeout(timer);
    }
  }, [squares, xIsNext, gameMode, gameStarted, gameOver, autoPlaySpeed, mlAI]);

  // Human vs Bot
  useEffect(() => {
    if (gameMode === 'human-vs-bot' && !xIsNext && !gameOver && gameStarted) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [squares, xIsNext, gameMode, gameOver, gameStarted]);

  const handleModeSelect = (mode) => {
    if (mode === 'multiplayer') {
      navigate('/multiplayer');
    } else {
      setGameMode(mode);
      setGameStarted(false);
      resetGame();
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setGameStarted(false);
  };

  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (isDraw) {
      return 'Game is a draw!';
    } else {
      return `Next player: ${xIsNext ? 'X' : 'O'}`;
    }
  };

  const getCurrentPlayer = () => {
    if (gameMode === 'human-vs-bot') {
      return xIsNext ? 'You (X)' : 'Bot (O)';
    } else if (gameMode === 'bot-vs-bot') {
      return xIsNext ? 'Bot X' : 'Bot O';
    } else {
      return xIsNext ? 'Player X' : 'Player O';
    }
  };

  return (
    <div className="game">
      <div className="game-header">
        <h1>🎮 Tic-Tac-Toe</h1>
        <p className="subtitle">Unbeatable AI Edition</p>
      </div>

      {!gameStarted ? (
        <div className="game-setup">
          <GameModeSelector 
            selectedMode={gameMode} 
            onModeSelect={handleModeSelect} 
          />
          
          {gameMode === 'bot-vs-bot' && (
            <div className="speed-control">
              <label>Auto-play Speed:</label>
              <select 
                value={autoPlaySpeed} 
                onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
              >
                <option value={2000}>Slow</option>
                <option value={1000}>Normal</option>
                <option value={500}>Fast</option>
                <option value={200}>Very Fast</option>
              </select>
            </div>
          )}
          
          <button className="start-button" onClick={startGame}>
            Start Game
          </button>
          
          {/* <button 
            className="ml-trainer-button" 
            onClick={() => setShowMLTrainer(true)}
          >
            🤖 Train ML AI
          </button> */}
        </div>
      ) : (
        <div className="game-play">
          <div className="game-info">
            <div className="status">{getStatus()}</div>
            <div className="current-player">Current: {getCurrentPlayer()}</div>
          </div>
          
          <Board 
            squares={squares} 
            onSquareClick={handleSquareClick}
            winningLine={getWinningLine()}
          />
          
          <div className="game-controls">
            <button className="reset-button" onClick={resetGame}>
              New Game
            </button>
            <button className="mode-button" onClick={() => setGameStarted(false)}>
              Change Mode
            </button>
          </div>
        </div>
      )}
      
      {showMLTrainer && (
        <MLTrainer 
          onClose={() => setShowMLTrainer(false)}
          onModelReady={(trainedAI) => {
            setMlAI(trainedAI);
            setShowMLTrainer(false);
          }}
        />
      )}
    </div>
  );
};

export default Game; 