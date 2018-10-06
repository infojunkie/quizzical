import {Column, Entity, JoinTable, OneToMany, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from './Enrollment';
import {Achievement} from './Achievement';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(type => Enrollment, enrollment => enrollment.student)
  @JoinTable()
  enrollments: Enrollment[];

  @OneToMany(type => Achievement, achievement => achievement.student)
  @JoinTable()
  achievements: Achievement[];
}
