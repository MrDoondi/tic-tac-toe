const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active games and players
const games = new Map();
const players = new Map();

// Game state management
class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.squares = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameStarted = false;
    this.winner = null;
    this.isDraw = false;
  }

  addPlayer(player) {
    if (this.players.length < 2) {
      this.players.push(player);
      player.gameRoom = this;
      player.symbol = this.players.length === 1 ? 'X' : 'O';
      player.isHost = this.players.length === 1; // First player is the host
      
      // Notify all players in the room
      this.broadcast({
        type: 'playerJoined',
        playerId: player.id,
        symbol: player.symbol,
        playerCount: this.players.length,
        isHost: player.isHost
      });

      // Don't auto-start the game, wait for host to start it
      return true;
    }
    return false;
  }

  removePlayer(player) {
    const index = this.players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      this.players.splice(index, 1);
      player.gameRoom = null;
      
      this.broadcast({
        type: 'playerLeft',
        playerId: player.id,
        playerCount: this.players.length
      });

      if (this.players.length === 0) {
        games.delete(this.roomId);
      }
    }
  }

  startGame() {
    this.gameStarted = true;
    this.broadcast({
      type: 'gameStarted',
      squares: this.squares,
      currentPlayer: this.currentPlayer
    });
  }

  makeMove(playerId, position) {
    if (!this.gameStarted || this.winner || this.isDraw) return false;
    
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.symbol !== this.currentPlayer) return false;
    
    if (this.squares[position] !== null) return false;

    this.squares[position] = this.currentPlayer;
    
    // Check for winner
    this.winner = this.checkWinner();
    this.isDraw = !this.winner && this.squares.every(square => square !== null);
    
    if (!this.winner && !this.isDraw) {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    this.broadcast({
      type: 'moveMade',
      position: position,
      symbol: this.currentPlayer === 'X' ? 'O' : 'X', // The symbol that was just placed
      squares: this.squares,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      isDraw: this.isDraw
    });

    return true;
  }

  checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (this.squares[a] && this.squares[a] === this.squares[b] && this.squares[a] === this.squares[c]) {
        return this.squares[a];
      }
    }
    return null;
  }

  resetGame() {
    this.squares = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.isDraw = false;
    
    this.broadcast({
      type: 'gameReset',
      squares: this.squares,
      currentPlayer: this.currentPlayer
    });
  }

  broadcast(message) {
    this.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  const playerId = generatePlayerId();
  const player = {
    id: playerId,
    ws: ws,
    gameRoom: null
  };
  
  players.set(playerId, player);

  console.log(`Player ${playerId} connected`);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    playerId: playerId
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(player, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`);
    
    if (player.gameRoom) {
      player.gameRoom.removePlayer(player);
    }
    
    players.delete(playerId);
  });
});

function handleMessage(player, data) {
  switch (data.type) {
    case 'joinRoom':
      handleJoinRoom(player, data.roomId);
      break;
    case 'createRoom':
      handleCreateRoom(player);
      break;
    case 'startGame':
      if (player.gameRoom && player.isHost && player.gameRoom.players.length === 2) {
        player.gameRoom.startGame();
      }
      break;
    case 'makeMove':
      if (player.gameRoom) {
        player.gameRoom.makeMove(player.id, data.position);
      }
      break;
    case 'resetGame':
      if (player.gameRoom) {
        player.gameRoom.resetGame();
      }
      break;
    case 'leaveRoom':
      if (player.gameRoom) {
        player.gameRoom.removePlayer(player);
      }
      break;
  }
}

function handleJoinRoom(player, roomId) {
  let gameRoom = games.get(roomId);
  
  if (!gameRoom) {
    gameRoom = new GameRoom(roomId);
    games.set(roomId, gameRoom);
  }

  if (gameRoom.addPlayer(player)) {
    player.ws.send(JSON.stringify({
      type: 'roomJoined',
      roomId: roomId,
      symbol: player.symbol
    }));
  } else {
    player.ws.send(JSON.stringify({
      type: 'roomFull',
      roomId: roomId
    }));
  }
}

function handleCreateRoom(player) {
  const roomId = generateRoomId();
  const gameRoom = new GameRoom(roomId);
  games.set(roomId, gameRoom);
  
  gameRoom.addPlayer(player);
  
  player.ws.send(JSON.stringify({
    type: 'roomCreated',
    roomId: roomId,
    symbol: player.symbol
  }));
}

function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
  return 'room_' + Math.random().toString(36).substr(2, 6);
}

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`WebSocket server running on ${HOST}:${PORT}`);
});

module.exports = server; 