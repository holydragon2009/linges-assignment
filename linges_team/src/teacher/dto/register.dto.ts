import { IsEmail, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Teacher email must be a valid email' })
  teacher: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one student must be provided' })
  @IsEmail({}, { each: true, message: 'All student emails must be valid' })
  students: string[];
}