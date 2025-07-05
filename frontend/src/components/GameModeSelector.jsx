import React from 'react';
import './GameModeSelector.css';

const GameModeSelector = ({ selectedMode, onModeSelect }) => {
  const modes = [
    { id: 'human-vs-human', label: 'Human vs Human', icon: '👥' },
    { id: 'human-vs-bot', label: 'Human vs Bot', icon: '🤖' },
    { id: 'bot-vs-bot', label: 'Bot vs Bot', icon: '⚡' },
    { id: 'multiplayer', label: 'Online Multiplayer', icon: '🌐' }
  ];

  return (
    <div className="game-mode-selector">
      <h3>Select Game Mode</h3>
      <div className="mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={`mode-button ${selectedMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeSelect(mode.id)}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameModeSelector; 