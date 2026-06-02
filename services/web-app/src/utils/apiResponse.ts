import axios from "axios";

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// Utility function to handle from ApiResponse
export async function handleApiResponse<T>(
  promise: Promise<any>
): Promise<T> {
  try {
    const response = await promise;
    const data = response?.data as ApiResponse<T> | undefined;

    if (!data || data.code !== 1000) {
      throw new Error(data?.message || "API Error");
    }

    return data.result;
  } catch (error) {
    // if (axios.isAxiosError(error)) {
    //   const data = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
    //   const message = data?.message || error.message || "API Error";
    //   throw new Error(message);
    // }

    throw error;
  }
}