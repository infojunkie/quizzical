import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  getConnection
} from 'typeorm';
import {Skill} from './Skill';
import {Enrollment} from './Enrollment';
import {Answer} from './Answer';

/**
 * A quiz contains both the questions asked to a student for a particular skill,
 * and the student's answers. Because these two pieces of data are created at different times,
 * the quiz object must be held in memory by the client until all answers have been gathered.
 * A quiz cannot be saved to database until answers are fully filled. Specifically, the `Quiz.started`
 * and `completed` attributes, in addition to each `Answer.started`, `completed`,
 * `correct`, and `best` attributes.
 */
@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Enrollment)
  enrollment: Enrollment;

  @ManyToOne(type => Skill)
  skill: Skill;

  @Column()
  level: number;

  @Column("datetime", { nullable: true })
  started: Date;

  @Column("datetime", { nullable: true })
  completed: Date;

  @OneToMany(type => Answer, answer => answer.quiz, { cascade: true })
  answers: Answer[];

  /**
   * Calculate the score for a quiz based on all its correct answers.
   * Assumes each `Answer.correct` has already been set.
   */
  async score(): Promise<number> {
    return this.answers.reduce((score, answer) => {
      return score + <any>answer.correct;
    }, 0);
  }
}
