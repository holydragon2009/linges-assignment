-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS teacher_student (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE KEY unique_teacher_student (teacher_id, student_id)
);

-- Insert sample teachers
INSERT INTO teachers (email) VALUES
  ('teacherken@gmail.com'),
  ('teacherjoe@gmail.com'),
  ('teacherbob@gmail.com'),
  ('teachermary@gmail.com');

-- Insert sample students
INSERT INTO students (email, is_suspended) VALUES
  ('studentjon@gmail.com', FALSE),
  ('studenthon@gmail.com', FALSE),
  ('studentmiche@gmail.com', FALSE),
  ('studentagnes@gmail.com', FALSE),
  ('studentmary@gmail.com', FALSE),
  ('studentbob@gmail.com', TRUE),
  ('studentalice@gmail.com', FALSE),
  ('studentbill@gmail.com', FALSE);

-- Create teacher-student relationships
-- Teacher Ken's students
INSERT INTO teacher_student (teacher_id, student_id) VALUES
  (1, 1), -- teacherken - studentjon
  (1, 2), -- teacherken - studenthon
  (1, 3), -- teacherken - studentmiche
  (1, 4); -- teacherken - studentagnes

-- Teacher Joe's students
INSERT INTO teacher_student (teacher_id, student_id) VALUES
  (2, 2), -- teacherjoe - studenthon
  (2, 3), -- teacherjoe - studentmiche
  (2, 5), -- teacherjoe - studentmary
  (2, 6); -- teacherjoe - studentbob

-- Teacher Bob's students
INSERT INTO teacher_student (teacher_id, student_id) VALUES
  (3, 4), -- teacherbob - studentagnes
  (3, 5), -- teacherbob - studentmary
  (3, 7); -- teacherbob - studentalice

-- Teacher Mary's students
INSERT INTO teacher_student (teacher_id, student_id) VALUES
  (4, 1), -- teachermary - studentjon
  (4, 7), -- teachermary - studentalice
  (4, 8); -- teachermary - studentbill