import axiosInstance from './axios';
import { API_BASE_URL } from '../config';

const QUESTION_API = `${API_BASE_URL}/api/knowledge-hub/questions/`;

export const getQuestions = async (params = {}) => {
  return axiosInstance.get(QUESTION_API, { params });
};

export const getQuestion = async (id) => {
  return axiosInstance.get(`${QUESTION_API}${id}/`);
};

export const createQuestion = async (questionData) => {
  return axiosInstance.post(QUESTION_API, questionData);
};

export const updateQuestion = async (id, questionData) => {
  return axiosInstance.put(`${QUESTION_API}${id}/`, questionData);
};

export const deleteQuestion = async (id) => {
  return axiosInstance.delete(`${QUESTION_API}${id}/`);
};

export const voteQuestion = async (id, voteType) => {
  return axiosInstance.post(`${QUESTION_API}${id}/vote/`, { vote_type: voteType });
};

export const answerQuestion = async (questionId, content) => {
  return axiosInstance.post(`${QUESTION_API}${questionId}/answer/`, { content });
};

export const getAnswers = async (questionId) => {
  return axiosInstance.get(`${QUESTION_API}${questionId}/answers/`);
};

export const voteAnswer = async (questionId, answerId, voteType) => {
  return axiosInstance.post(`${QUESTION_API}${questionId}/answers/${answerId}/vote/`, { vote_type: voteType });
};

export const markAnswerAsVerified = async (questionId, answerId) => {
  return axiosInstance.post(`${QUESTION_API}${questionId}/answers/${answerId}/mark_verified/`);
};

export const unmarkAnswerAsVerified = async (questionId, answerId) => {
  return axiosInstance.post(`${QUESTION_API}${questionId}/answers/${answerId}/unmark_verified/`);
};

export const incrementQuestionView = async (questionId) => {
  return axiosInstance.get(`${QUESTION_API}${questionId}/increment_view/`);
}; 