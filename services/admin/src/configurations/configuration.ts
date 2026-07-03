export const CONFIG = {
  // Kết nối qua API Gateway tại http://localhost:8888/api
  API: import.meta.env.VITE_API_URL,
}
export const API = {
  // identity-service: POST /auth/token (body: {username, password})
  LOGIN: "/identity/auth/token",
  // FORGOT_PASSWORD và RESET_PASSWORD chưa có trong identity-service microservice
  // FORGOT_PASSWORD: "/identity/auth/forgot-password",
  // RESET_PASSWORD: "/identity/auth/reset-password",
  MY_INFO: "/identity/users/myInfo",
  UPDATE_USER: "/identity/users/${userId}",
}
