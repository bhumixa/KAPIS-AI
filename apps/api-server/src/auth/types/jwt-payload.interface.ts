export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtPayloadWithRefreshToken extends JwtPayload {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
