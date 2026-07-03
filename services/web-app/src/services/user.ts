import httpClient from "../configurations/httpClient";
import { handleApiResponse } from "../utils/apiResponse";

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
}

export const getMyInfo = async () => {
  return handleApiResponse<UserResponse>(
    httpClient.get('/identity/users/myInfo')
  );
};
