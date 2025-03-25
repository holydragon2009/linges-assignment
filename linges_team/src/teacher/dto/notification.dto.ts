import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class NotificationDto {
  @IsEmail({}, { message: 'Teacher email must be a valid email' })
  teacher: string;

  @IsString()
  @IsNotEmpty({ message: 'Notification text cannot be empty' })
  notification: string;
}