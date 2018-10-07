import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Student} from './Student';

@Entity()
export class DailyScore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Student, student => student.scores)
  student: Student;

  @Column("date")
  date: Date;

  @Column({ default: 0 })
  score: number = 0;

  @Column()
  goal: number; // goal on that day
}
