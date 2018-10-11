import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  getConnection
} from 'typeorm';
import {Student} from './Student';
import {Course} from './Course';
import {Quiz} from './Quiz';
import {Skill} from './Skill';
import {SkillLevel} from './SkillLevel';
import {Answer} from './Answer';
import {Question} from './Question';
import {CONFIG} from '../config';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Course)
  course: Course;

  @ManyToOne(type => Student, student => student.enrollments)
  student: Student;

  @OneToMany(type => SkillLevel, skillLevel => skillLevel.enrollment)
  skillLevels: SkillLevel[];

  @Column("datetime")
  enrolled: Date;

  @OneToMany(type => Quiz, quiz => quiz.enrollment)
  quizzes: Quiz[];

  async missingQuestionsForSkillLevel(skill: Skill, level: number): Promise<number> {
    // Check the skill level reached by the student
    // based on quiz answers, not on the saved skillLevels.
    // A level is reached when are no more questions of the given skill that are left unanswered.
    return await getConnection()
      .getRepository(Question)
      .createQueryBuilder('question')
      .leftJoinAndSelect(Answer, 'answer',
        'answer.questionId = question.id AND answer.enrollmentId = :enrollmentId', { enrollmentId: this.id }
      )
      .where('question.skillId = :skillId', { skillId: skill.id })
      .andWhere('question.level = :level', { level })
      .andWhere('answer.id IS NULL')
      // TODO handle when answer.passed = false AND there is no other answer to the same question that passed.
      .getCount();
  }

  async availableSkills(): Promise<Skill[]> {
    // Available skills are those that have no prerequisites
    // or whose prerequisistes have been learned by the student.
    return await getConnection()
      .getRepository(Skill)
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.prerequisites', 'prerequisite')
      .leftJoinAndSelect(SkillLevel, "prerequisiteSkillLevel", "prerequisiteSkillLevel.skillId = prerequisite.id")
      .where('skill.courseId = :id', { id: this.course.id })
      .andWhere('(prerequisite.id IS NULL OR prerequisiteSkillLevel.level > 0)')
      .getMany();
  }

  // https://www.frankmitchell.org/2015/01/fisher-yates/
  static shuffle<T>(array: Array<T>): Array<T> {
    var i = 0
      , j = 0
      , temp = null

    for (i = array.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1))
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }

    return array;
  }

  async quiz(skill: Skill): Promise<Quiz> {
    // To generate a new quiz for a given skill:
    // 1. Get unanswered questions for the next skill level
    // 2. Complement with answered questions with mistakes if not enough in step 1
    // 3. Complement with random answered questions if not enough in step 2

    // These are ALL the questions for the given skill, for the level about the latest one obtained.
    // We will sort through them later.
    const questions = await getConnection()
      .getRepository(Question)
      .createQueryBuilder('question')
      .leftJoinAndSelect(Answer, 'answer',
        'answer.questionId = question.id AND answer.enrollmentId = :enrollmentId', { enrollmentId: this.id }
      )
      .where('question.skillId = :skillId', { skillId: skill.id })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('skillLevel.level+1', 'skilllevel_level')
          .from(SkillLevel, 'skillLevel')
          .where('skillLevel.skillId = :skillId', { skillId: skill.id })
          // Tricky bit: if the student has no level in the given skill, return level 1.
          // That's the role of UNION SELECT 1.
          .andWhere('skillLevel.enrollmentId = :enrollmentId UNION SELECT 1', { enrollmentId: this.id })
          .orderBy('skilllevel_level', 'DESC')
          .limit(1)
          .getQuery();
        return 'question.level IN ' + subQuery;
      })
      .getRawMany();

    // Unanswered questions.
    let selectedQuestions = questions.filter(q => !q.answer_id);

    // Answered questions with mistakes.
    if (selectedQuestions.length < CONFIG.questionsPerQuiz) {
      const unpassed = questions.filter(q => q.answer_passed === 0);
      selectedQuestions = selectedQuestions.concat(Enrollment.shuffle(unpassed).slice(0, CONFIG.questionsPerQuiz-selectedQuestions.length));
    }

    // Random other questions.
    if (selectedQuestions.length < CONFIG.questionsPerQuiz) {
      const passed = questions.filter(q => q.answer_passed === 1);
      selectedQuestions = selectedQuestions.concat(Enrollment.shuffle(passed).slice(0, CONFIG.questionsPerQuiz-selectedQuestions.length));
    }

    // Trim to questions per quiz.
    selectedQuestions = selectedQuestions.slice(0, CONFIG.questionsPerQuiz);
    if (!selectedQuestions) return null;

    const quiz = new Quiz();
    quiz.enrollment = this;
    quiz.skill = skill;
    quiz.level = selectedQuestions[0].question_level;
    quiz.answers = selectedQuestions.map(question => {
      const answer = new Answer();
      answer.quiz = quiz;
      answer.question = question;
      answer.enrollment = this;
      return answer;
    });
    return quiz;
  }
}
