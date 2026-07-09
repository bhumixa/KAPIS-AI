import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty()
  sub!: string;

  @ApiProperty()
  email!: string;
}
