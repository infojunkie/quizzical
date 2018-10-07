import {Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Student} from './Student';
import {Course} from './Course';
import {Quiz} from './Quiz';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Course)
  course: Course;

  @ManyToOne(type => Student, student => student.enrollments)
  student: Student;

  @Column("datetime")
  enrolled: Date;

  @OneToMany(type => Quiz, quiz => quiz.enrollment)
  quizzes: Quiz[];
}
