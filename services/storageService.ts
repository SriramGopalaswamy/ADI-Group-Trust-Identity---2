import { Submission } from '../types';

const STORAGE_KEY = 'adi_bharat_submissions';

export const saveSubmission = (submission: Submission): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const submissions: Submission[] = existingData ? JSON.parse(existingData) : [];
    submissions.push(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error("Failed to save submission", error);
  }
};

export const getSubmissions = (): Submission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load submissions", error);
    return [];
  }
};

export const clearSubmissions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
