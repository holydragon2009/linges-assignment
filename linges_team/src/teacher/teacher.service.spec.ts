import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherService } from './teacher.service';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
});

describe('TeacherService', () => {
  let service: TeacherService;
  let teacherRepository: MockRepository<Teacher>;
  let studentRepository: MockRepository<Student>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        { provide: getRepositoryToken(Teacher), useValue: createMockRepository() },
        { provide: getRepositoryToken(Student), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    teacherRepository = module.get<MockRepository<Teacher>>(getRepositoryToken(Teacher));
    studentRepository = module.get<MockRepository<Student>>(getRepositoryToken(Student));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register students to a teacher', async () => {
      const registerDto = {
        teacher: 'teacher@example.com',
        students: ['student1@example.com', 'student2@example.com'],
      };

      const teacher = {
        id: 1,
        email: 'teacher@example.com',
        students: [],
      };

      const student1 = {
        id: 1,
        email: 'student1@example.com',
        suspended: false,
      };

      const student2 = {
        id: 2,
        email: 'student2@example.com',
        suspended: false,
      };

      teacherRepository.findOne.mockResolvedValue(teacher);
      studentRepository.findOne.mockResolvedValueOnce(student1).mockResolvedValueOnce(student2);

      await service.register(registerDto);

      expect(teacherRepository.save).toHaveBeenCalledWith({
        ...teacher,
        students: [student1, student2],
      });
    });

    it('should create a new teacher if not found', async () => {
      const registerDto = {
        teacher: 'newteacher@example.com',
        students: ['student1@example.com'],
      };

      const newTeacher = {
        email: 'newteacher@example.com',
        students: [],
      };

      const student = {
        id: 1,
        email: 'student1@example.com',
        suspended: false,
      };

      teacherRepository.findOne.mockResolvedValue(null);
      teacherRepository.create.mockReturnValue(newTeacher);
      studentRepository.findOne.mockResolvedValue(student);

      await service.register(registerDto);

      expect(teacherRepository.create).toHaveBeenCalledWith({
        email: 'newteacher@example.com',
        students: [],
      });
      expect(teacherRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCommonStudents', () => {
    it('should return common students for multiple teachers', async () => {
      const teacherEmails = ['teacher1@example.com', 'teacher2@example.com'];

      const teacher1 = {
        id: 1,
        email: 'teacher1@example.com',
        students: [
          { id: 1, email: 'common@example.com', suspended: false },
          { id: 2, email: 'student1@example.com', suspended: false },
        ],
      };

      const teacher2 = {
        id: 2,
        email: 'teacher2@example.com',
        students: [
          { id: 1, email: 'common@example.com', suspended: false },
          { id: 3, email: 'student2@example.com', suspended: false },
        ],
      };

      teacherRepository.find.mockResolvedValue([teacher1, teacher2]);

      const result = await service.getCommonStudents(teacherEmails);

      expect(result).toEqual(['common@example.com']);
    });

    it('should throw an error if a teacher is not found', async () => {
      const teacherEmails = ['teacher1@example.com', 'nonexistent@example.com'];

      const teacher1 = {
        id: 1,
        email: 'teacher1@example.com',
        students: [],
      };

      teacherRepository.find.mockResolvedValue([teacher1]);

      await expect(service.getCommonStudents(teacherEmails)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if no teacher emails are provided', async () => {
      await expect(service.getCommonStudents([])).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspendStudent', () => {
    it('should suspend a student', async () => {
      const suspendDto = {
        student: 'student@example.com',
      };

      const student = {
        id: 1,
        email: 'student@example.com',
        suspended: false,
      };

      studentRepository.findOne.mockResolvedValue(student);

      await service.suspendStudent(suspendDto);

      expect(studentRepository.save).toHaveBeenCalledWith({
        ...student,
        suspended: true,
      });
    });

    it('should throw an error if student is not found', async () => {
      const suspendDto = {
        student: 'nonexistent@example.com',
      };

      studentRepository.findOne.mockResolvedValue(null);

      await expect(service.suspendStudent(suspendDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotificationRecipients', () => {
    it('should return all eligible students for notification', async () => {
      const notificationDto = {
        teacher: 'teacher@example.com',
        notification: 'Hello @student2@example.com @student3@example.com',
      };

      const teacher = {
        id: 1,
        email: 'teacher@example.com',
        students: [
          { id: 1, email: 'student1@example.com', suspended: false },
          { id: 4, email: 'suspended@example.com', suspended: true },
        ],
      };

      const registeredStudents = [
        { id: 1, email: 'student1@example.com', suspended: false },
      ];

      const mentionedStudents = [
        { id: 2, email: 'student2@example.com', suspended: false },
        { id: 3, email: 'student3@example.com', suspended: false },
      ];

      teacherRepository.findOne.mockResolvedValue(teacher);
      studentRepository.createQueryBuilder().getMany.mockResolvedValue(registeredStudents);
      studentRepository.find.mockResolvedValue(mentionedStudents);

      const result = await service.getNotificationRecipients(notificationDto);

      expect(result).toEqual(['student1@example.com', 'student2@example.com', 'student3@example.com']);
    });

    it('should throw an error if teacher is not found', async () => {
      const notificationDto = {
        teacher: 'nonexistent@example.com',
        notification: 'Hello students',
      };

      teacherRepository.findOne.mockResolvedValue(null);

      await expect(service.getNotificationRecipients(notificationDto)).rejects.toThrow(NotFoundException);
    });

    it('should extract mentioned emails from notification', async () => {
      const notification = 'Hello @student1@example.com and @student2@example.com';
      const extractedEmails = service['extractMentionedEmails'](notification);
      
      expect(extractedEmails).toEqual(['student1@example.com', 'student2@example.com']);
    });

    it('should return empty array if no emails are mentioned', async () => {
      const notification = 'Hello everyone!';
      const extractedEmails = service['extractMentionedEmails'](notification);
      
      expect(extractedEmails).toEqual([]);
    });
  });
});