import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Skill} from './Skill';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @OneToMany(type => Skill, skill => skill.course)
  skills: Skill[];
}
