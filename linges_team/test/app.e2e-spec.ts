import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Teacher } from '../src/entities/teacher.entity';
import { Student } from '../src/entities/student.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let teacherRepository;
  let studentRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());

    teacherRepository = moduleFixture.get(getRepositoryToken(Teacher));
    studentRepository = moduleFixture.get(getRepositoryToken(Student));

    await app.init();

    // Clear database before each test
    await teacherRepository.query('DELETE FROM teacher_student');
    await teacherRepository.query('DELETE FROM teacher');
    await studentRepository.query('DELETE FROM student');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/register (POST)', () => {
    it('should register students to a teacher', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentjon@gmail.com', 'studenthon@gmail.com']
        })
        .expect(204);
    });

    it('should return 400 if teacher email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'invalid-email',
          students: ['studentjon@gmail.com']
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('Teacher email must be a valid email');
        });
    });

    it('should return 400 if student email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['invalid-email']
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('All student emails must be valid');
        });
    });
  });

  describe('/api/commonstudents (GET)', () => {
    beforeEach(async () => {
      // Setup test data
      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['commonstudent1@gmail.com', 'commonstudent2@gmail.com', 'student_only_under_teacher_ken@gmail.com']
        });

      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherjoe@gmail.com',
          students: ['commonstudent1@gmail.com', 'commonstudent2@gmail.com']
        });
    });

    it('should get students for a single teacher', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents?teacher=teacherken@gmail.com')
        .expect(200)
        .expect(res => {
          expect(res.body.students).toContain('commonstudent1@gmail.com');
          expect(res.body.students).toContain('commonstudent2@gmail.com');
          expect(res.body.students).toContain('student_only_under_teacher_ken@gmail.com');
          expect(res.body.students.length).toBe(3);
        });
    });

    it('should get common students for multiple teachers', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents?teacher=teacherken@gmail.com&teacher=teacherjoe@gmail.com')
        .expect(200)
        .expect(res => {
          expect(res.body.students).toContain('commonstudent1@gmail.com');
          expect(res.body.students).toContain('commonstudent2@gmail.com');
          expect(res.body.students).not.toContain('student_only_under_teacher_ken@gmail.com');
          expect(res.body.students.length).toBe(2);
        });
    });

    it('should return 400 if no teacher is provided', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents')
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('At least one teacher must be provided');
        });
    });
  });

  describe('/api/suspend (POST)', () => {
    beforeEach(async () => {
      // Setup test data
      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentmary@gmail.com']
        });
    });

    it('should suspend a student', () => {
      return request(app.getHttpServer())
        .post('/api/suspend')
        .send({
          student: 'studentmary@gmail.com'
        })
        .expect(204);
    });

    it('should return 404 if student does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/suspend')
        .send({
          student: 'nonexistent@gmail.com'
        })
        .expect(404)
        .expect(res => {
          expect(res.body.message).toContain('Student with email nonexistent@gmail.com not found');
        });
    });
  });

  describe('/api/retrievefornotifications (POST)', () => {
    beforeEach(async () => {
      // Setup test data
      await request(app.getHttpServer())
        .post('/api/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentbob@gmail.com', 'studentagnes@gmail.com', 'studentmiche@gmail.com']
        });

      // Suspend studentmiche
      await request(app.getHttpServer())
        .post('/api/suspend')
        .send({
          student: 'studentmiche@gmail.com'
        });
    });

    it('should retrieve notification recipients including mentioned students', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: 'teacherken@gmail.com',
          notification: 'Hello students! @studentagnes@gmail.com @studentmiche@gmail.com'
        })
        .expect(200)
        .expect(res => {
          expect(res.body.recipients).toContain('studentbob@gmail.com');
          expect(res.body.recipients).toContain('studentagnes@gmail.com');
          // studentmiche is suspended, so should not be included
          expect(res.body.recipients).not.toContain('studentmiche@gmail.com');
        });
    });

    it('should retrieve only registered students when no mentions', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: 'teacherken@gmail.com',
          notification: 'Hey everybody'
        })
        .expect(200)
        .expect(res => {
          expect(res.body.recipients).toContain('studentbob@gmail.com');
          expect(res.body.recipients).toContain('studentagnes@gmail.com');
          // studentmiche is suspended, so should not be included
          expect(res.body.recipients).not.toContain('studentmiche@gmail.com');
        });
    });

    it('should return 404 if teacher does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: 'nonexistent@gmail.com',
          notification: 'Hello students!'
        })
        .expect(404)
        .expect(res => {
          expect(res.body.message).toContain('Teacher with email nonexistent@gmail.com not found');
        });
    });
  });
});