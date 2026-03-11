import toast from 'react-hot-toast';

/**
 * Global error handler utility
 * Handles Supabase errors, network failures, and unexpected JavaScript errors
 * @param {Error} error - The error object to handle
 * @param {string} fallbackMessage - Optional fallback message context (e.g., 'signup', 'login')
 */
export const handleError = (error, fallbackMessage = 'An error occurred') => {
  // Log full error for debugging
  console.error('Error details:', error);

  let userMessage;

  // Handle Supabase errors
  if (error.message?.includes('Invalid login credentials')) {
    userMessage = 'Invalid email or password. Please try again.';
  } else if (error.message?.includes('Email not confirmed')) {
    userMessage = 'Please verify your email address before logging in.';
  } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
    userMessage = 'Network error. Please check your internet connection.';
  } else if (error.message?.includes('JWT')) {
    userMessage = 'Your session has expired. Please log in again.';
  } else if (error.message) {
    // Use the error message if it's user-friendly
    userMessage = error.message;
  } else {
    // Fallback for unclear errors
    userMessage = `${fallbackMessage}. Please try again.`;
  }

  toast.error(userMessage);
};