import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { RegisterDto } from './dto/register.dto';
import { SuspendDto } from './dto/suspend.dto';
import { NotificationDto } from './dto/notification.dto';

@Controller('api')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    try {
      await this.teacherService.register(registerDto);
    } catch (error) {
      if (error.code === 'DUPLICATE_ENTRY') {
        throw new ConflictException('Teacher or student already registered');
      }
      throw error;
    }
  }

  @Get('commonstudents')
  async getCommonStudents(@Query('teacher') teacher: string | string[]): Promise<{ students: string[] }> {
    if (!teacher) {
      throw new BadRequestException('At least one teacher must be provided');
    }

    const teacherEmails = Array.isArray(teacher) ? teacher : [teacher];
    
    try {
      const students = await this.teacherService.getCommonStudents(teacherEmails);
      return { students };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(`Teacher not found: ${error.message}`);
      }
      throw error;
    }
  }

  @Post('suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspendStudent(@Body() suspendDto: SuspendDto): Promise<void> {
    try {
      await this.teacherService.suspendStudent(suspendDto);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(`Student not found: ${suspendDto.student}`);
      }
      throw error;
    }
  }

  @Post('retrievefornotifications')
  async getNotificationRecipients(@Body() notificationDto: NotificationDto): Promise<{ recipients: string[] }> {
    try {
      const recipients = await this.teacherService.getNotificationRecipients(notificationDto);
      return { recipients };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(`Teacher not found: ${notificationDto.teacher}`);
      }
      throw error;
    }
  }
}