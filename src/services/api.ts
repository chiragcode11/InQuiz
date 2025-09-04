import axios from 'axios';
import { InterviewConfig, Resume, InterviewSession, InterviewResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const apiService = {
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResume: async (resumeId: string): Promise<Resume> => {
    const response = await api.get(`/resume/${resumeId}`);
    return response.data;
  },

  generateQuestions: async (resumeId: string, config: InterviewConfig) => {
    const response = await api.post(`/generate-questions/${resumeId}`, config);
    return response.data;
  },

  getInterview: async (interviewId: string): Promise<InterviewSession> => {
    const response = await api.get(`/interview/${interviewId}`);
    return response.data;
  },

  getCurrentQuestion: async (interviewId: string, questionIndex: number) => {
    const response = await api.get(`/interview/${interviewId}/question/${questionIndex}`);
    return response.data;
  },

  startInterview: async (interviewId: string) => {
    const response = await api.post(`/interview/${interviewId}/start`);
    return response.data;
  },

  submitResponse: async (interviewId: string, response: InterviewResponse) => {
    const apiResponse = await api.post(`/interview/${interviewId}/response`, response);
    return apiResponse.data;
  },

  completeInterview: async (interviewId: string) => {
    const response = await api.post(`/interview/${interviewId}/complete`);
    return response.data;
  },

  startVoiceInterview: async (interviewId: string) => {
    try {
      console.log('Starting voice interview:', interviewId);
      const response = await api.post(`/interview/${interviewId}/start-voice`);
      console.log('Voice interview started:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting voice interview:', error);
      throw error;
    }
  },

  submitVoiceResponse: async (interviewId: string, responseData: { response: string, response_time: number }) => {
    try {
      console.log('Submitting voice response:', interviewId, responseData);
      const response = await api.post(`/interview/${interviewId}/voice-response`, responseData);
      console.log('Voice response submitted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting voice response:', error);
      throw error;
    }
  },

  getConversation: async (interviewId: string) => {
    try {
      const response = await api.get(`/interview/${interviewId}/conversation`);
      return response.data;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  completeVoiceInterview: async (interviewId: string) => {
    try {
      const response = await api.post(`/interview/${interviewId}/complete-voice`);
      return response.data;
    } catch (error) {
      console.error('Error completing voice interview:', error);
      throw error;
    }
  },
};
