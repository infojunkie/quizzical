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

  @OneToMany(type => Answer, answer => answer.quiz)
  answers: Answer[];

  async score(): Promise<number> {
    // TODO add logic to reward first-time correct answers.
    return (await getConnection().manager.findAndCount(Answer, { quiz: this }))[1];
  }
}
