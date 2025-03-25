import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { RegisterDto } from './dto/register.dto';
import { SuspendDto } from './dto/suspend.dto';
import { NotificationDto } from './dto/notification.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const { teacher: teacherEmail, students: studentEmails } = registerDto;

    // Find or create teacher
    let teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    if (!teacher) {
      teacher = this.teacherRepository.create({ email: teacherEmail, students: [] });
      await this.teacherRepository.save(teacher);
    }

    // Find or create students
    for (const studentEmail of studentEmails) {
      let student = await this.studentRepository.findOne({
        where: { email: studentEmail },
      });

      if (!student) {
        student = this.studentRepository.create({ email: studentEmail });
        await this.studentRepository.save(student);
      }

      // Check if student is already registered to this teacher
      const isRegistered = teacher.students.some(s => s.email === studentEmail);
      if (!isRegistered) {
        teacher.students.push(student);
      }
    }

    await this.teacherRepository.save(teacher);
  }

  async getCommonStudents(teacherEmails: string[]): Promise<string[]> {
    if (!teacherEmails || teacherEmails.length === 0) {
      throw new BadRequestException('At least one teacher email must be provided');
    }

    // Find all teachers
    const teachers = await this.teacherRepository.find({
      where: { email: In(teacherEmails) },
      relations: ['students'],
    });

    if (teachers.length !== teacherEmails.length) {
      const foundTeacherEmails = teachers.map(t => t.email);
      const missingTeachers = teacherEmails.filter(email => !foundTeacherEmails.includes(email));
      throw new NotFoundException(`Teacher(s) not found: ${missingTeachers.join(', ')}`);
    }

    // If only one teacher, return all their students
    if (teachers.length === 1) {
      return teachers[0].students.map(student => student.email);
    }

    // Find common students among all teachers
    const studentEmailsMap = new Map<string, number>();

    teachers.forEach(teacher => {
      teacher.students.forEach(student => {
        const count = studentEmailsMap.get(student.email) || 0;
        studentEmailsMap.set(student.email, count + 1);
      });
    });

    // Return students who are registered to all teachers
    return Array.from(studentEmailsMap.entries())
      .filter(([_, count]) => count === teachers.length)
      .map(([email]) => email);
  }

  async suspendStudent(suspendDto: SuspendDto): Promise<void> {
    const { student: studentEmail } = suspendDto;

    const student = await this.studentRepository.findOne({
      where: { email: studentEmail },
    });

    if (!student) {
      throw new NotFoundException(`Student with email ${studentEmail} not found`);
    }

    student.suspended = true;
    await this.studentRepository.save(student);
  }

  async getNotificationRecipients(notificationDto: NotificationDto): Promise<string[]> {
    const { teacher: teacherEmail, notification } = notificationDto;

    // Check if teacher exists
    const teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with email ${teacherEmail} not found`);
    }

    // Get all students registered to the teacher who are not suspended
    const registeredStudents = await this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.teachers', 'teacher', 'teacher.email = :teacherEmail', { teacherEmail })
      .where('student.suspended = :suspended', { suspended: false })
      .getMany();

    const registeredStudentEmails = registeredStudents.map(student => student.email);

    // Extract mentioned students from notification
    const mentionedStudentEmails = this.extractMentionedEmails(notification);

    // Get mentioned students who are not suspended
    const mentionedStudents = await this.studentRepository.find({
      where: {
        email: In(mentionedStudentEmails),
        suspended: false,
      },
    });

    const mentionedStudentEmailsNotSuspended = mentionedStudents.map(student => student.email);

    // Combine and remove duplicates
    const recipients = [...new Set([...registeredStudentEmails, ...mentionedStudentEmailsNotSuspended])];

    return recipients;
  }

  private extractMentionedEmails(notification: string): string[] {
    const emailRegex = /@([\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;
    const matches = notification.match(emailRegex) || [];
    return matches.map(match => match.substring(1)); // Remove the @ symbol
  }
}