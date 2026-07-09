import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config/configuration';
import { JwtPayload, JwtPayloadWithRefreshToken } from '../types/jwt-payload.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<{ app: AppConfig }>) {
    const jwtConfig = configService.get('app', { infer: true })!.jwt;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRefreshToken {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!refreshToken) {
      throw new Error('Refresh token not found on request');
    }
    return { ...payload, refreshToken };
  }
}
