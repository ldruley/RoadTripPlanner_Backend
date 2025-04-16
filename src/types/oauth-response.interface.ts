import { User } from '../users/entities/user.entity';

export interface OAuthResponse {
  access_token: string;
  user: User;
  platform: 'web' | 'mobile'; // locked down to valid values only
}
