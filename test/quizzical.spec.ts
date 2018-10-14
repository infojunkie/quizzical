import {loadTestData} from './setup';
import {expect} from 'chai';
import {Enrollment} from '../src/entity/Enrollment';

describe('Quizzical', () => {
  let connection = null;

  before(async () => connection = await loadTestData());

  it('Generate new quiz', async () => {
    // Generate new quiz for Caio.
    await (async () => {
      const enrollment = await connection
        .getRepository(Enrollment)
        .createQueryBuilder('enrollment')
        .leftJoinAndSelect('enrollment.student', 'student')
        .leftJoinAndSelect('enrollment.course', 'course')
        .where('student.name = :name', { name: 'Caio' })
        .andWhere('course.label = :label', { label: 'Spanish' })
        .getOne();
      const skills = await enrollment.availableSkills();
      expect(skills.map(s => s.label)).to.eql([ 'Basics 1' ]);
      const quiz = await enrollment.quiz(skills[0]);
      expect(quiz.level).to.equal(1);
    })();

    // Generate new quiz for Karim.
    await (async () => {
      const enrollment = await connection
        .getRepository(Enrollment)
        .createQueryBuilder('enrollment')
        .leftJoinAndSelect('enrollment.student', 'student')
        .leftJoinAndSelect('enrollment.course', 'course')
        .where('student.name = :name', { name: 'Karim' })
        .andWhere('course.label = :label', { label: 'Portuguese' })
        .getOne();
      const skills = await enrollment.availableSkills();
      expect(skills.map(s => s.label)).to.eql([ 'Basics 1', 'Basics 2' ]);
      const quiz = await enrollment.quiz(skills[0]);
      expect(quiz.level).to.equal(2);
    })();
  });
});
