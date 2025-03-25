import { IsEmail } from 'class-validator';

export class SuspendDto {
  @IsEmail({}, { message: 'Student email must be a valid email' })
  student: string;
}