import {Column, Entity, JoinTable, OneToMany, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Quiz} from './Quiz';
import {Question} from './Question';
import {Enrollment} from './Enrollment';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Quiz, quiz => quiz.answers)
  quiz: Quiz;

  @ManyToOne(type => Enrollment)
  enrollment: Enrollment;

  @ManyToOne(type => Question)
  question: Question;

  @Column({ type: "simple-json" })
  answer: any = null;

  @Column("datetime")
  started: Date;

  @Column("datetime")
  completed: Date;

  @Column()
  passed: boolean;

  @Column({ type: "simple-json" })
  correct: any = null;
}
