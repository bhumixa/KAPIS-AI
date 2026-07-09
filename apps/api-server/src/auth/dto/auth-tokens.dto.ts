import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token lifetime, e.g. "15m"' })
  expiresIn!: string;
}
