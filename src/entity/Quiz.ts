import {Column, Entity, JoinTable, OneToMany, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
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
}
