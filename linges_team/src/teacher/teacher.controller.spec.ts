import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { BadRequestException } from '@nestjs/common';

describe('TeacherController', () => {
  let controller: TeacherController;
  let service: TeacherService;

  beforeEach(async () => {
    const mockTeacherService = {
      register: jest.fn(),
      getCommonStudents: jest.fn(),
      suspendStudent: jest.fn(),
      getNotificationRecipients: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherController],
      providers: [
        {
          provide: TeacherService,
          useValue: mockTeacherService,
        },
      ],
    }).compile();

    controller = module.get<TeacherController>(TeacherController);
    service = module.get<TeacherService>(TeacherService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call service.register with the provided dto', async () => {
      const registerDto = {
        teacher: 'teacher@example.com',
        students: ['student1@example.com', 'student2@example.com'],
      };

      await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('getCommonStudents', () => {
    it('should call service.getCommonStudents with a single teacher', async () => {
      const teacher = 'teacher@example.com';
      const students = ['student1@example.com', 'student2@example.com'];

      jest.spyOn(service, 'getCommonStudents').mockResolvedValue(students);

      const result = await controller.getCommonStudents(teacher);

      expect(service.getCommonStudents).toHaveBeenCalledWith([teacher]);
      expect(result).toEqual({ students });
    });

    it('should call service.getCommonStudents with multiple teachers', async () => {
      const teachers = ['teacher1@example.com', 'teacher2@example.com'];
      const students = ['common@example.com'];

      jest.spyOn(service, 'getCommonStudents').mockResolvedValue(students);

      const result = await controller.getCommonStudents(teachers);

      expect(service.getCommonStudents).toHaveBeenCalledWith(teachers);
      expect(result).toEqual({ students });
    });

    it('should throw BadRequestException if no teacher is provided', async () => {
      await expect(controller.getCommonStudents(null)).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspendStudent', () => {
    it('should call service.suspendStudent with the provided dto', async () => {
      const suspendDto = {
        student: 'student@example.com',
      };

      await controller.suspendStudent(suspendDto);

      expect(service.suspendStudent).toHaveBeenCalledWith(suspendDto);
    });
  });

  describe('getNotificationRecipients', () => {
    it('should call service.getNotificationRecipients with the provided dto', async () => {
      const notificationDto = {
        teacher: 'teacher@example.com',
        notification: 'Hello @student@example.com',
      };

      const recipients = ['student@example.com', 'registeredstudent@example.com'];

      jest.spyOn(service, 'getNotificationRecipients').mockResolvedValue(recipients);

      const result = await controller.getNotificationRecipients(notificationDto);

      expect(service.getNotificationRecipients).toHaveBeenCalledWith(notificationDto);
      expect(result).toEqual({ recipients });
    });
  });
});