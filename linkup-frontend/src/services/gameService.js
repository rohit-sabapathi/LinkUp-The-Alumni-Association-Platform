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

// Connections Game API
export const fetchConnectionsDomains = async () => {
  try {
    const response = await api.get(`${GAMES_URL}/connections/domains/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching connection domains:', error);
    throw error;
  }
};

export const fetchCurrentConnectionsGame = async (domain = 'computer_science') => {
  try {
    const response = await api.get(`${GAMES_URL}/connections/current/`, {
      params: { domain }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching current connections game:', error);
    throw error;
  }
};

export const submitConnectionsGuess = async (wordIds, domain = 'computer_science') => {
  try {
    const response = await api.post(
      `${GAMES_URL}/connections/guess/`,
      { word_ids: wordIds, domain }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting connections guess:', error);
    throw error;
  }
};

export const fetchConnectionsSolution = async (domain = 'computer_science') => {
  try {
    const response = await api.get(`${GAMES_URL}/connections/solution/`, {
      params: { domain }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching connections solution:', error);
    throw error;
  }
};

export const fetchConnectionsLeaderboard = async () => {
  try {
    const response = await api.get(`${GAMES_URL}/connections/leaderboard/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching connections leaderboard:', error);
    throw error;
  }
}; 