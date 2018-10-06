import {Column, Entity, JoinTable, OneToMany, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
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

  @Column({ default: 0 })
  goal: number;

  @Column("json")
  scores: any = {};

  @OneToMany(type => Quiz, quiz => quiz.enrollment)
  quizzes: Quiz[];
}
