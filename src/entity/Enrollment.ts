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
import {Helpers} from '../Helpers';
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

  /**
   * Check the skill level reached by the student
   * based on quiz answers, not on the saved skillLevels.
   * A level is reached when there are no more questions of the given skill left unanswered.
   */
  async missingQuestionsForSkillLevel(skill: Skill, level: number): Promise<number> {
    return await getConnection()
      .getRepository(Question)
      .createQueryBuilder('question')
      .leftJoinAndSelect(Answer, 'answer',
        'answer.questionId = question.id AND answer.correct = 1 AND answer.enrollmentId = :enrollmentId', { enrollmentId: this.id }
      )
      .where('question.skillId = :skillId', { skillId: skill.id })
      .andWhere('question.level = :level', { level })
      .andWhere('answer.id IS NULL')
      .getCount();
  }

  /**
   * Available skills are those that have no prerequisites
   * or whose prerequisistes have been learned by the student.
   */
  async availableSkills(): Promise<Skill[]> {
    return await getConnection()
      .getRepository(Skill)
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.prerequisites', 'prerequisite')
      .leftJoinAndSelect(SkillLevel, "prerequisiteSkillLevel", "prerequisiteSkillLevel.skillId = prerequisite.id")
      .where('skill.courseId = :id', { id: this.course.id })
      .andWhere('(prerequisite.id IS NULL OR prerequisiteSkillLevel.level > 0)')
      .getMany();
  }

  /**
   * Generate a new quiz for a given skill:
   * 1. Get unanswered questions for the next skill level
   * 2. Complement with random answered questions with mistakes if not enough in step 1
   * 3. Complement with random answered questions without mistakes if not enough in step 2
   *
   * IMPORTANT: The returned quiz is NOT saved to the database. It is assumed that the caller
   * will keep it in memory until all questions are answered by the student, then it can be saved
   * along with the filled answers.
   */
  async quiz(skill: Skill): Promise<Quiz> {
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
      const incorrect = questions.filter(q => q.answer_correct === 0);
      selectedQuestions = selectedQuestions.concat(Helpers.shuffle(incorrect).slice(0, CONFIG.questionsPerQuiz-selectedQuestions.length));
    }

    // Random other questions.
    if (selectedQuestions.length < CONFIG.questionsPerQuiz) {
      const correct = questions.filter(q => q.answer_correct === 1);
      selectedQuestions = selectedQuestions.concat(Helpers.shuffle(correct).slice(0, CONFIG.questionsPerQuiz-selectedQuestions.length));
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
