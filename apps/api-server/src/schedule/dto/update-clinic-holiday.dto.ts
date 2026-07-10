import { PartialType } from '@nestjs/swagger';
import { CreateClinicHolidayDto } from './create-clinic-holiday.dto';

export class UpdateClinicHolidayDto extends PartialType(CreateClinicHolidayDto) {}
