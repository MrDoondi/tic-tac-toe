// Minimax algorithm for unbeatable AI
export const checkWinner = (squares) => {
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
};

export const isBoardFull = (squares) => {
  return squares.every(square => square !== null);
};

export const getAvailableMoves = (squares) => {
  return squares
    .map((square, index) => square === null ? index : null)
    .filter(index => index !== null);
};

export const minimax = (squares, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
  const winner = checkWinner(squares);
  
  if (winner === 'O') return 10 - depth; // AI wins
  if (winner === 'X') return depth - 10; // Human wins
  if (isBoardFull(squares)) return 0; // Draw
  
  const availableMoves = getAvailableMoves(squares);
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let move of availableMoves) {
      const newSquares = [...squares];
      newSquares[move] = 'O';
      const score = minimax(newSquares, depth + 1, false, alpha, beta);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let move of availableMoves) {
      const newSquares = [...squares];
      newSquares[move] = 'X';
      const score = minimax(newSquares, depth + 1, true, alpha, beta);
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  }
};

export const getBestMove = (squares) => {
  const availableMoves = getAvailableMoves(squares);
  let bestScore = -Infinity;
  let bestMove = null;
  
  for (let move of availableMoves) {
    const newSquares = [...squares];
    newSquares[move] = 'O';
    const score = minimax(newSquares, 0, false);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}; 