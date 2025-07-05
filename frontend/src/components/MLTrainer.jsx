import React, { useState, useEffect } from 'react';
import MLAI from '../utils/mlAI.js';
import './MLTrainer.css';

const MLTrainer = ({ onClose, onModelReady }) => {
  const [mlAI, setMlAI] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [episodes, setEpisodes] = useState(10000);

  useEffect(() => {
    const ai = new MLAI();
    
    // Try to load existing model
    if (ai.loadModel()) {
      setStats(ai.getStats());
      console.log('Loaded existing ML model');
    }
    
    setMlAI(ai);
  }, []);

  const startTraining = async () => {
    if (!mlAI) return;
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Override console.log to track progress
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const message = args.join(' ');
      if (message.includes('Training progress:')) {
        const match = message.match(/(\d+)\/(\d+)/);
        if (match) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          setTrainingProgress((current / total) * 100);
        }
      }
    };

    try {
      await mlAI.train(episodes);
      setStats(mlAI.getStats());
      mlAI.saveModel();
      
      if (onModelReady) {
        onModelReady(mlAI);
      }
    } catch (error) {
      console.error('Training error:', error);
    } finally {
      console.log = originalLog;
      setIsTraining(false);
    }
  };

  const resetModel = () => {
    if (!mlAI) return;
    
    localStorage.removeItem('ticTacToeMLModel');
    const newAI = new MLAI();
    setMlAI(newAI);
    setStats(null);
  };

  const loadModel = () => {
    if (!mlAI) return;
    
    if (mlAI.loadModel()) {
      setStats(mlAI.getStats());
      if (onModelReady) {
        onModelReady(mlAI);
      }
    }
  };

  return (
    <div className="ml-trainer-overlay">
      <div className="ml-trainer">
        <div className="ml-trainer-header">
          <h2>🤖 ML AI Trainer</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="ml-trainer-content">
          <div className="training-section">
            <h3>Train the AI</h3>
            <p>Train the AI through self-play to become unbeatable!</p>
            
            <div className="training-controls">
              <label>
                Training Episodes:
                <input
                  type="number"
                  value={episodes}
                  onChange={(e) => setEpisodes(parseInt(e.target.value))}
                  min="1000"
                  max="100000"
                  step="1000"
                  disabled={isTraining}
                />
              </label>
              
              <button 
                className="train-button"
                onClick={startTraining}
                disabled={isTraining}
              >
                {isTraining ? 'Training...' : 'Start Training'}
              </button>
            </div>

            {isTraining && (
              <div className="training-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${trainingProgress}%` }}
                  ></div>
                </div>
                <p>{trainingProgress.toFixed(1)}% Complete</p>
              </div>
            )}
          </div>

          <div className="model-section">
            <h3>Model Management</h3>
            
            <div className="model-controls">
              <button onClick={loadModel} disabled={isTraining}>
                Load Saved Model
              </button>
              <button onClick={resetModel} disabled={isTraining}>
                Reset Model
              </button>
            </div>

            {stats && (
              <div className="model-stats">
                <h4>Training Statistics</h4>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Games Played:</span>
                    <span className="stat-value">{stats.gamesPlayed}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Win Rate:</span>
                    <span className="stat-value">{stats.winRate}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Model Size:</span>
                    <span className="stat-value">{stats.modelSize} states</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Wins:</span>
                    <span className="stat-value">{stats.wins}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Losses:</span>
                    <span className="stat-value">{stats.losses}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Draws:</span>
                    <span className="stat-value">{stats.draws}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>How it Works</h3>
            <ul>
              <li><strong>Q-Learning:</strong> The AI learns optimal strategies through trial and error</li>
              <li><strong>Self-Play:</strong> The AI plays thousands of games against itself</li>
              <li><strong>Experience:</strong> Each game teaches the AI better moves</li>
              <li><strong>Unbeatable:</strong> After training, the AI becomes nearly impossible to beat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLTrainer; 