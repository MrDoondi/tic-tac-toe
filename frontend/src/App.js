import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Game from './components/Game.jsx';
import MultiplayerGame from './components/MultiplayerGame.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/multiplayer" element={<MultiplayerGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
