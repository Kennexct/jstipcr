export function getCleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  
  const msg = err.message || (typeof err === 'string' ? err : '');
  
  // Check if it is a Supabase request failure
  if (msg.includes('Supabase request failed:')) {
    try {
      const jsonStart = msg.indexOf('{');
      if (jsonStart !== -1) {
        const jsonStr = msg.substring(jsonStart);
        const parsed = JSON.parse(jsonStr);
        if (parsed.message) {
          if (parsed.message.includes('violates unique constraint') || parsed.message.includes('duplicate key')) {
            return 'This record or username already exists.';
          }
          if (parsed.message.includes('relation') && parsed.message.includes('does not exist')) {
            return 'Database tables are not fully set up. Running in offline fallback.';
          }
          return parsed.message;
        }
      }
    } catch (e) {
      // ignore
    }
    
    if (msg.includes('409') || msg.includes('400')) {
      return 'Conflict or invalid data submitted.';
    }
    if (msg.includes('404')) {
      return 'Requested resource could not be found.';
    }
    if (msg.includes('401') || msg.includes('403')) {
      return 'Unauthorized access. Please log in again.';
    }
    return 'Database request failed. Please check your connection.';
  }

  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'Database tables are not fully set up. Running in offline fallback.';
  }
  
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  
  return msg || 'An unexpected error occurred.';
}
