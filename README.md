# Teacher-Student Management API

This application provides an API for managing teacher-student relationships, including registration, retrieving common students, suspending students, and sending notifications.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed

## Running Locally with Docker Compose

The application consists of two services:
- API service (Node.js) - runs on port 3000
- MySQL Database - runs on port 3306

### Environment Setup

The following environment variables are pre-configured in docker-compose.yml:
- Database name: teacher_student_db
- Database user: root
- Database password: root
- API port: 3000

### API Endpoints

Once running, the following endpoints are available at `http://localhost:3000`:

1. **Register Students** 
   - Endpoint: `POST /api/register`
   - Registers one or more students to a teacher

2. **Get Common Students**
   - Endpoint: `GET /api/commonstudents`
   - Retrieves students common to a given list of teachers

3. **Suspend Student**
   - Endpoint: `POST /api/suspend`
   - Suspends a specified student

4. **Retrieve Notification Recipients**
   - Endpoint: `POST /api/retrievefornotifications`
   - Gets a list of students who can receive a notification

### Sample Data

The database is pre-populated with the following test data:

Teachers:
- teacherken@gmail.com
- teacherjoe@gmail.com
- teacherbob@gmail.com
- teachermary@gmail.com

Students:
- studentjon@gmail.com
- studenthon@gmail.com
- studentmiche@gmail.com
- studentagnes@gmail.com
- studentmary@gmail.com
- studentbob@gmail.com (suspended)
- studentalice@gmail.com
- studentbill@gmail.com

### Database Schema

The application uses three main tables:
- `teachers` - Stores teacher information
- `students` - Stores student information and suspension status
- `teacher_student` - Maps the relationships between teachers and students

### Running with Docker Compose

To start the application:
docker-compose up -d

To stop the application:
docker-compose down