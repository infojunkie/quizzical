import {Column, Entity, JoinTable, OneToMany, ManyToOne, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Course} from './Course';
import {Question} from './Question';

@Entity()
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Course, course => course.skills)
  course: Course;

  @ManyToMany(type => Skill, skill => skill.prerequisites)
  dependents: Skill[];

  @ManyToMany(type => Skill, skill => skill.dependents, {
    cascade: true
  })
  @JoinTable({
    joinColumn: {
      name: "skillId",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "skillPrerequisiteId",
      referencedColumnName: "id"
    }
  })
  prerequisites: Skill[];

  @Column()
  label: string;

  @Column()
  description: string;

  @OneToMany(type => Question, question => question.skill)
  questions: Question[];
}
