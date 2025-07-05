// Machine Learning AI using Q-Learning for Tic-Tac-Toe
class MLAI {
  constructor() {
    this.qTable = new Map(); // State-action pairs and their Q-values
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 0.1; // For exploration vs exploitation
    this.trainingMode = false;
    this.gamesPlayed = 0;
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
  }

  // Convert board state to string for storage
  stateToString(squares) {
    return squares.map(square => square || '-').join('');
  }

  // Get all possible actions for a state
  getAvailableActions(squares) {
    return squares
      .map((square, index) => square === null ? index : null)
      .filter(index => index !== null);
  }

  // Get Q-value for a state-action pair
  getQValue(state, action) {
    const key = `${state}-${action}`;
    return this.qTable.get(key) || 0;
  }

  // Set Q-value for a state-action pair
  setQValue(state, action, value) {
    const key = `${state}-${action}`;
    this.qTable.set(key, value);
  }

  // Choose action using epsilon-greedy strategy
  chooseAction(squares, player) {
    const state = this.stateToString(squares);
    const availableActions = this.getAvailableActions(squares);
    
    if (availableActions.length === 0) return null;

    // Epsilon-greedy: explore with probability epsilon, exploit with 1-epsilon
    if (Math.random() < this.epsilon && this.trainingMode) {
      // Explore: choose random action
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    } else {
      // Exploit: choose best action based on Q-values
      let bestAction = availableActions[0];
      let bestQValue = this.getQValue(state, bestAction);

      for (let action of availableActions) {
        const qValue = this.getQValue(state, action);
        if (qValue > bestQValue) {
          bestQValue = qValue;
          bestAction = action;
        }
      }

      return bestAction;
    }
  }

  // Update Q-values based on reward
  updateQValue(state, action, reward, nextState, nextAvailableActions) {
    const currentQ = this.getQValue(state, action);
    
    // Find maximum Q-value for next state
    let maxNextQ = 0;
    if (nextAvailableActions.length > 0) {
      maxNextQ = Math.max(...nextAvailableActions.map(a => this.getQValue(nextState, a)));
    }

    // Q-learning update formula
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    this.setQValue(state, action, newQ);
  }

  // Get reward for game outcome
  getReward(gameResult, player) {
    if (gameResult === 'draw') return 0.5;
    if (gameResult === player) return 1.0;
    return -1.0;
  }

  // Train the AI through self-play
  async train(episodes = 10000) {
    console.log('Starting ML AI training...');
    this.trainingMode = true;
    
    for (let episode = 0; episode < episodes; episode++) {
      const squares = Array(9).fill(null);
      const moves = [];
      let currentPlayer = 'X';
      
      // Play a complete game
      while (true) {
        const state = this.stateToString(squares);
        const action = this.chooseAction(squares, currentPlayer);
        
        if (action === null) break;
        
        moves.push({ state, action, player: currentPlayer });
        squares[action] = currentPlayer;
        
        // Check for game end
        const winner = this.checkWinner(squares);
        const isDraw = !winner && this.isBoardFull(squares);
        
        if (winner || isDraw) {
          // Update Q-values for all moves in this game
          const gameResult = winner || 'draw';
          
          for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const nextState = i < moves.length - 1 ? this.stateToString(squares) : '';
            const nextActions = i < moves.length - 1 ? this.getAvailableActions(squares) : [];
            const reward = this.getReward(gameResult, move.player);
            
            this.updateQValue(move.state, move.action, reward, nextState, nextActions);
          }
          
          // Update statistics
          this.gamesPlayed++;
          if (winner === 'X') this.wins++;
          else if (winner === 'O') this.losses++;
          else this.draws++;
          
          break;
        }
        
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      }
      
      // Progress update every 1000 episodes
      if ((episode + 1) % 1000 === 0) {
        console.log(`Training progress: ${episode + 1}/${episodes} episodes completed`);
        console.log(`Win rate: ${(this.wins / this.gamesPlayed * 100).toFixed(1)}%`);
      }
    }
    
    this.trainingMode = false;
    console.log('Training completed!');
    console.log(`Final stats - Games: ${this.gamesPlayed}, Wins: ${this.wins}, Losses: ${this.losses}, Draws: ${this.draws}`);
  }

  // Make a move using the trained model
  makeMove(squares, player) {
    return this.chooseAction(squares, player);
  }

  // Check for winner (same as minimax)
  checkWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  // Check if board is full
  isBoardFull(squares) {
    return squares.every(square => square !== null);
  }

  // Save trained model to localStorage
  saveModel() {
    const modelData = {
      qTable: Object.fromEntries(this.qTable),
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      losses: this.losses,
      draws: this.draws
    };
    localStorage.setItem('ticTacToeMLModel', JSON.stringify(modelData));
    console.log('ML model saved to localStorage');
  }

  // Load trained model from localStorage
  loadModel() {
    const savedData = localStorage.getItem('ticTacToeMLModel');
    if (savedData) {
      const modelData = JSON.parse(savedData);
      this.qTable = new Map(Object.entries(modelData.qTable));
      this.gamesPlayed = modelData.gamesPlayed || 0;
      this.wins = modelData.wins || 0;
      this.losses = modelData.losses || 0;
      this.draws = modelData.draws || 0;
      console.log('ML model loaded from localStorage');
      return true;
    }
    return false;
  }

  // Get training statistics
  getStats() {
    return {
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      losses: this.losses,
      draws: this.draws,
      winRate: this.gamesPlayed > 0 ? (this.wins / this.gamesPlayed * 100).toFixed(1) : 0,
      modelSize: this.qTable.size
    };
  }
}

export default MLAI; 