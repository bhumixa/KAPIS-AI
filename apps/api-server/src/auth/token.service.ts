import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '../config/configuration';
import { AuthTokens, JwtPayload } from './types/jwt-payload.interface';

// @nestjs/jwt types `expiresIn` as the `ms` package's strict `StringValue` template
// literal type (e.g. "15m"), but our config value arrives from an env var as a plain
// `string`. The value itself is already validated at boot by envValidationSchema, so
// this cast just bridges an env-driven string across a type `ms` can't infer statically.
const asExpiresIn = (value: string): JwtSignOptions['expiresIn'] =>
  value as JwtSignOptions['expiresIn'];

// Owns access/refresh token signing so AuthModule's controller and any future
// business module (e.g. a real login endpoint once Users has a password_hash
// column) share one place that knows about JWT secrets and expirations.
@Injectable()
export class TokenService {
  private readonly jwtConfig: AppConfig['jwt'];

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService<{ app: AppConfig }>,
  ) {
    this.jwtConfig = configService.get('app', { infer: true })!.jwt;
  }

  async generateTokenPair(payload: JwtPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.secret,
        expiresIn: asExpiresIn(this.jwtConfig.expiresIn),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: asExpiresIn(this.jwtConfig.refreshExpiresIn),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: this.jwtConfig.expiresIn };
  }
}
