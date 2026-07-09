import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { TokenService } from './token.service';
import { JwtPayload, JwtPayloadWithRefreshToken } from './types/jwt-payload.interface';

// Sprint 11 ships the JWT/refresh-token *architecture* only. There is no
// POST /auth/login here yet: clinic.users has no password_hash column (see
// database/migrations/009_create_users.sql), so a real login endpoint is deferred
// to the sprint that wires this module to the Users API. This controller exposes
// what can be built without a credential store - refreshing a token pair, and
// resolving the caller's identity from an existing access token.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly tokenService: TokenService) {}

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rotate a valid refresh token into a new access/refresh token pair',
  })
  refresh(@CurrentUser() user: JwtPayloadWithRefreshToken): Promise<AuthTokensDto> {
    return this.tokenService.generateTokenPair({ sub: user.sub, email: user.email });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Resolve the caller's identity from the current access token" })
  me(@CurrentUser() user: JwtPayload): CurrentUserDto {
    return { sub: user.sub, email: user.email };
  }
}
