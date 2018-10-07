import {ChildEntity} from 'typeorm';
import {Badge} from './Badge';
import {Student} from './Student';

@ChildEntity()
export class WildfireBadge extends Badge {
  async earned(student: Student, date: Date): Promise<number> {
    const streak = await student.streak(date);
    try {
      [30, 15, 2].forEach( (target, index, targets) => {
        if (streak >= target) throw (targets.length - index);
      });
    }
    catch (level) {
      return level;
    }
    return 0;
  }
}

@ChildEntity()
export class ChampionBadge extends Badge {
}

@ChildEntity()
export class SharpshooterBadge extends Badge {
}
