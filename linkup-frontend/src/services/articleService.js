import axiosInstance from './axios';
import { API_BASE_URL } from '../config';

const ARTICLE_API = `${API_BASE_URL}/api/knowledge-hub/articles/`;

export const getArticles = async () => {
  return axiosInstance.get(ARTICLE_API);
};

export const getArticle = async (id) => {
  return axiosInstance.get(`${ARTICLE_API}${id}/`);
};

export const createArticle = async (articleData) => {
  return axiosInstance.post(ARTICLE_API, articleData);
};

export const updateArticle = async (id, articleData) => {
  return axiosInstance.put(`${ARTICLE_API}${id}/`, articleData);
};

export const deleteArticle = async (id) => {
  return axiosInstance.delete(`${ARTICLE_API}${id}/`);
};

export const likeArticle = async (id) => {
  return axiosInstance.post(`${ARTICLE_API}${id}/like/`);
};

export const unlikeArticle = async (id) => {
  return axiosInstance.delete(`${ARTICLE_API}${id}/like/`);
};

export const bookmarkArticle = async (id) => {
  return axiosInstance.post(`${ARTICLE_API}${id}/bookmark/`);
};

export const unbookmarkArticle = async (id) => {
  return axiosInstance.delete(`${ARTICLE_API}${id}/bookmark/`);
};

export const addComment = async (articleId, commentData) => {
  return axiosInstance.post(`${ARTICLE_API}${articleId}/comment/`, commentData);
};

export const getArticleComments = async (articleId) => {
  return axiosInstance.get(`${ARTICLE_API}${articleId}/comments/`);
};

export const getBookmarkedArticles = async () => {
  return axiosInstance.get(`${API_BASE_URL}/api/users/me/bookmarks/`);
};

export const getMyArticles = async () => {
  return axiosInstance.get(`${API_BASE_URL}/api/users/me/articles/`);
}; 