import {Column, Entity, JoinTable, OneToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Student} from './Student';
import {Badge} from './Badge';

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Student, student => student.achievements)
  student: Student;

  @ManyToOne(type => Badge)
  badge: Badge;

  @Column()
  level: number;

  @Column("date")
  obtained: Date;
}
