import {Column, Entity, JoinTable, OneToMany, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Quiz} from './Quiz';
import {Question} from './Question';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Quiz, quiz => quiz.answers)
  quiz: Quiz;

  @ManyToOne(type => Question)
  question: Question;

  @Column({ type: "simple-json", nullable: true })
  answer: any = null;

  @Column("datetime")
  started: Date;

  @Column("datetime")
  submitted: Date;

  @Column({ nullable: true })
  passed: boolean;
}
