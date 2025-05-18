import { API_URL } from 'react-native-dotenv';
import { TokenInfo, UserInfo } from '../context/UserContext';

interface GoogleAuthResponse {
  id: string;
  user_id: number;
  name: string;
  email: string;
  picture?: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: string;
}

export async function authenticateWithGoogle(idToken: string, platform: string): Promise<{ token: TokenInfo, userInfo: UserInfo }> {
  const response = await fetch(`${API_URL}/auth/mobile/google-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      id_token: idToken,
      platform: platform
    }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data: GoogleAuthResponse = await response.json();

  // Transform the response to match our app's interfaces
  const token: TokenInfo = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in.toString(),
    user: data.user
  };

  const userInfo: UserInfo = {
    googleId: data.id,
    userId: data.user_id.toString(),
    name: data.name,
    email: data.email,
    picture: data.picture
  };

  return { token, userInfo };
}
