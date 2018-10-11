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

@Entity()
export class SkillLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Enrollment, enrollment => enrollment.skillLevels)
  enrollment: Enrollment;

  @ManyToOne(type => Skill)
  skill: Skill;

  @Column()
  level: number;

  @Column('datetime')
  achieved: Date;
}
