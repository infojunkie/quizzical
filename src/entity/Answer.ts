import {Column, Entity, JoinTable, OneToMany, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Quiz} from './Quiz';
import {Question} from './Question';
import {Enrollment} from './Enrollment';

/**
 * An answer contains both the question asked to a student,
 * and the student's answer. Because these two pieces of data are created at different times,
 * the answer object must be held in memory by the client until the student's answer has been gathered.
 * An answer cannot be saved to database until all attributes are filled. Specifically, the
 * `Answer.started`, `completed`, `correct`, and `best` attributes.
 */
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

  /**
   * Student answer
   */
  @Column({ type: "simple-json" })
  answer: any = null;

  @Column("datetime")
  started: Date;

  @Column("datetime")
  completed: Date;

  @Column()
  correct: boolean;

  /**
   * Best answer as reported by `Question.evaluate()`
   */
  @Column({ type: "simple-json" })
  best: any = null;
}
