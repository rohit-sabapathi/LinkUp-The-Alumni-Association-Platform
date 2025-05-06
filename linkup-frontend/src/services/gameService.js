import axios from 'axios';
import { api } from './api';
import { API_URL } from '../config';

const GAMES_URL = `${API_URL}/games`;

// Wordle Game API
export const fetchCurrentGame = async () => {
  try {
    const response = await api.get(`${GAMES_URL}/wordle/current/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching current game:', error);
    throw error;
  }
};

export const submitGuess = async (guess) => {
  try {
    const response = await api.post(
      `${GAMES_URL}/wordle/guess/`,
      { guess }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
};

export const fetchLeaderboard = async () => {
  try {
    const response = await api.get(`${GAMES_URL}/wordle/leaderboard/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}; 