import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
  getConnection
} from 'typeorm';
import {DateUtils} from 'typeorm/util/DateUtils';
import {Enrollment} from './Enrollment';
import {DailyScore} from './DailyScore';
import {Achievement} from './Achievement';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  goal: number;

  @OneToMany(type => Enrollment, enrollment => enrollment.student)
  @JoinTable()
  enrollments: Enrollment[];

  @OneToMany(type => DailyScore, dailyScore => dailyScore.student)
  @JoinTable()
  scores: DailyScore[];

  @OneToMany(type => Achievement, achievement => achievement.student)
  @JoinTable()
  achievements: Achievement[];

  // Number of consecutive days of achieving daily goal
  // http://duolingo.wikia.com/wiki/Streak
  async streak(start: Date): Promise<number> {
    let streak = 0;
    do {
      const date = start;
      date.setDate(date.getDate() - streak);
      const dailyScore = await getConnection().manager.findOne(DailyScore, {
        date: DateUtils.mixedDateToDateString(date),
        student: this
      });
      if (!dailyScore || dailyScore.score < dailyScore.goal) return streak;
      streak++;
    } while (true);
  }
}
