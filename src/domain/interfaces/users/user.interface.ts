/**
 * Interface for user response (without password hash)
 */
export interface UserResponse {
  user_id: number;
  username: string;
  fullname: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}
