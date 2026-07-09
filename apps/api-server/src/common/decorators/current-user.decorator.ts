import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload, JwtPayloadWithRefreshToken } from '../../auth/types/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | JwtPayloadWithRefreshToken => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload | JwtPayloadWithRefreshToken;
  },
);
