import { toast } from 'sonner';

/**
 * Fetches data with retry logic for handling cold starts.
 * Shows a toast notification when retrying.
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 20, delay = 30000): Promise<any> {
    const TOAST_ID = 'cold-start-retry';
    let timeoutId: ReturnType<typeof setTimeout>;

    // Set a timeout to show the "waking up" message if fetch takes > 1s
    // This addresses the issue where the user is left waiting without feedback during cold starts
    timeoutId = setTimeout(() => {
        toast.loading('Server is waking up...', {
            id: TOAST_ID,
            duration: Infinity,
        });
    }, 1000);

    try {
        const res = await fetch(url, options);
        clearTimeout(timeoutId); // Clear the timeout so it doesn't fire if fetch completes quickly

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        // Dismiss the cold start toast if it exists
        toast.dismiss(TOAST_ID);

        return data;
    } catch (err) {
        clearTimeout(timeoutId); // Ensure timeout is cleared on error

        if (retries > 0) {
            // Show or update the toast to indicate retry
            toast.loading(`Server is waking up... Retrying in ${delay / 1000}s`, {
                id: TOAST_ID,
                duration: Infinity,
            });

            // Wait for the delay
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry
            return fetchWithRetry(url, options, retries - 1, delay);
        }

        // Final error
        toast.error('Connection failed. Please refresh the page.', {
            id: TOAST_ID,
            duration: 5000
        });
        throw err;
    }
}
