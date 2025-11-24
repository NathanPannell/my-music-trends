import { toast } from 'sonner';

/**
 * Fetches data with retry logic for handling cold starts.
 * Shows a toast notification when retrying.
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 20, delay = 30000): Promise<any> {
  try {
    const res = await fetch(url, options);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Dismiss the cold start toast if it exists
    toast.dismiss('cold-start-retry');
    
    return data;
  } catch (err) {
    if (retries > 0) {
      // Show or update the toast
      toast.loading(`Server is waking up... Retrying in ${delay / 1000}s`, {
        id: 'cold-start-retry',
        duration: Infinity,
      });
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    
    // Final error
    toast.error('Connection failed. Please refresh the page.', { 
      id: 'cold-start-retry',
      duration: 5000 
    });
    throw err;
  }
}
