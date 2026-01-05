export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  role: string; // Single role for compatibility with router and app logic
}

export interface ValidateUserResponse {
  message: string;
  user: UserInfo;
}
