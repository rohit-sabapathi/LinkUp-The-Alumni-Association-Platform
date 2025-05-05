import { api } from './api';
import { API_URL } from '../config';

const API_BASE_URL = `${API_URL}/mentorship`;

// Mentor profiles
export const getAllMentors = async () => {
  const response = await api.get(`${API_BASE_URL}/mentors/`);
  return response.data;
};

export const getMentorProfile = async (mentorId) => {
  const response = await api.get(`${API_BASE_URL}/mentors/${mentorId}/`);
  return response.data;
};

export const getMyMentorProfile = async () => {
  const response = await api.get(`${API_BASE_URL}/mentors/me/`);
  return response.data;
};

export const createMentorProfile = async (data) => {
  const response = await api.post(`${API_BASE_URL}/mentors/`, data);
  return response.data;
};

export const updateMentorProfile = async (data) => {
  const response = await api.patch(`${API_BASE_URL}/mentors/me/`, data);
  return response.data;
};

// Meeting requests
export const getAllMeetingRequests = async () => {
  const response = await api.get(`${API_BASE_URL}/meeting-requests/`);
  return response.data;
};

export const getMeetingRequestsAsMentor = async () => {
  const response = await api.get(`${API_BASE_URL}/meeting-requests/as_mentor/`);
  return response.data;
};

export const getMeetingRequestsAsMentee = async () => {
  const response = await api.get(`${API_BASE_URL}/meeting-requests/as_mentee/`);
  return response.data;
};

export const createMeetingRequest = async (data) => {
  const response = await api.post(`${API_BASE_URL}/meeting-requests/`, data);
  return response.data;
};

export const acceptMeetingRequest = async (requestId) => {
  const response = await api.post(`${API_BASE_URL}/meeting-requests/${requestId}/accept/`);
  return response.data;
};

export const declineMeetingRequest = async (requestId) => {
  const response = await api.post(`${API_BASE_URL}/meeting-requests/${requestId}/decline/`);
  return response.data;
};

// Meetings
export const getAllMeetings = async () => {
  const response = await api.get(`${API_BASE_URL}/meetings/`);
  return response.data;
};

export const getUpcomingMeetings = async () => {
  const response = await api.get(`${API_BASE_URL}/meetings/upcoming/`);
  return response.data;
};

export const cancelMeeting = async (meetingId) => {
  const response = await api.post(`${API_BASE_URL}/meetings/${meetingId}/cancel/`);
  return response.data;
};

export const completeMeeting = async (meetingId) => {
  const response = await api.post(`${API_BASE_URL}/meetings/${meetingId}/complete/`);
  return response.data;
}; 