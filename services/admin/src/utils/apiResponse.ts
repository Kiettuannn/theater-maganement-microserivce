export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// Utility function to handle from ApiResponse
export async function handleApiResponse<T>(
  promise: Promise<any>
): Promise<T> {
  const response = await promise;
  if(response.data.code !== 1000) {
    throw new Error(response.data.message || 'API Error');
  }
  return response.data.result;
}