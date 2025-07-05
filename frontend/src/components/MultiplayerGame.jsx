import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board.jsx';
import { websocketUrl } from '../config.js';
import './MultiplayerGame.css';

const MultiplayerGame = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [showRoomInput, setShowRoomInput] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setErrorMessage('');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (connectionStatus !== 'connected') {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('Connection error. Please check if the server is running.');
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        setPlayerId(data.playerId);
        break;
      
      case 'roomCreated':
        setRoomId(data.roomId);
        setPlayerSymbol(data.symbol);
        setIsHost(true);
        setShowRoomInput(false);
        break;
      
      case 'roomJoined':
        setRoomId(data.roomId);
        setPlayerSymbol(data.symbol);
        setIsHost(false);
        setShowRoomInput(false);
        break;
      
      case 'roomFull':
        setErrorMessage('Room is full. Please try another room.');
        break;
      
      case 'playerJoined':
        setPlayerCount(data.playerCount);
        if (data.isHost) {
          setIsHost(true);
        }
        break;
      
      case 'playerLeft':
        setPlayerCount(data.playerCount);
        if (data.playerCount < 2) {
          setGameStarted(false);
          setErrorMessage('Other player left the game.');
        }
        break;
      
      case 'gameStarted':
        setGameStarted(true);
        setSquares(data.squares);
        setCurrentPlayer(data.currentPlayer);
        setErrorMessage('');
        break;
      
      case 'moveMade':
        setSquares(data.squares);
        setCurrentPlayer(data.currentPlayer);
        setWinner(data.winner);
        setIsDraw(data.isDraw);
        break;
      
      case 'gameReset':
        setSquares(data.squares);
        setCurrentPlayer(data.currentPlayer);
        setWinner(null);
        setIsDraw(false);
        break;
    }
  };

  const createRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'createRoom' }));
    }
  };

  const joinRoom = (roomId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'joinRoom', 
        roomId: roomId 
      }));
    }
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'startGame' }));
    }
  };

  const handleSquareClick = (position) => {
    if (!gameStarted || winner || isDraw) return;
    if (currentPlayer !== playerSymbol) return;
    if (squares[position] !== null) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'makeMove',
        position: position
      }));
    }
  };

  const resetGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resetGame' }));
    }
  };

  const leaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leaveRoom' }));
    }
    setShowRoomInput(true);
    setRoomId('');
    setGameStarted(false);
    setSquares(Array(9).fill(null));
    setWinner(null);
    setIsDraw(false);
    setPlayerCount(0);
    setErrorMessage('');
  };

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (isDraw) {
      return 'Game is a draw!';
    } else if (gameStarted) {
      return `Current player: ${currentPlayer}`;
    } else if (playerCount === 2) {
      if (isHost) {
        return 'Both players ready! Click "Start Game" to begin.';
      } else {
        return 'Waiting for host to start the game...';
      }
    } else if (playerCount === 1) {
      return 'Waiting for opponent...';
    } else {
      return 'Create or join a room to start playing';
    }
  };

  const getWinningLine = () => {
    if (!winner) return null;
    
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

  return (
    <div className="multiplayer-game">
      <div className="multiplayer-header">
        <h2>🌐 Multiplayer Tic-Tac-Toe</h2>
        <div className="connection-status">
          Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {showRoomInput ? (
        <div className="room-setup">
          <div className="room-options">
            <button className="create-room-btn" onClick={createRoom}>
              🏠 Create New Room
            </button>
            
            <div className="join-room-section">
              <h3>Join Existing Room</h3>
              <div className="join-input">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom(roomId)}
                />
                <button onClick={() => joinRoom(roomId)} disabled={!roomId}>
                  Join
                </button>
              </div>
            </div>
          </div>
          
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Menu
          </button>
        </div>
      ) : (
        <div className="game-area">
          <div className="game-info">
            <div className="room-info">
              <strong>Room:</strong> {roomId}
              <br />
              <strong>You are:</strong> {playerSymbol}
              <br />
              <strong>Players:</strong> {playerCount}/2
              <br />
              <strong>Role:</strong> {isHost ? '🏠 Host' : '👤 Player'}
            </div>
            
            <div className="game-status">
              <div className="status">{getStatus()}</div>
            </div>
          </div>

          <Board 
            squares={squares} 
            onSquareClick={handleSquareClick}
            winningLine={getWinningLine()}
            disabled={!gameStarted || currentPlayer !== playerSymbol || winner || isDraw}
          />

          <div className="game-controls">
            {!gameStarted && playerCount === 2 && isHost && (
              <button className="start-game-button" onClick={startGame}>
                🎮 Start Game
              </button>
            )}
            <button className="reset-button" onClick={resetGame} disabled={!gameStarted}>
              New Game
            </button>
            <button className="leave-button" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame; 