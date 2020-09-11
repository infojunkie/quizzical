import 'reflect-metadata';
import * as TypeORM from 'typeorm';
import * as TypeGraphQL from 'type-graphql';
import {DateUtils} from 'typeorm/util/DateUtils';
import {Container} from 'typedi';
import {Course} from "./entity/Course";
import {CourseResolver} from './resolver/Course';
import {Skill} from "./entity/Skill";
import {Question} from "./entity/Question";
import {Badge} from "./entity/Badge";
import {Student} from "./entity/Student";
import {Enrollment} from "./entity/Enrollment";
import {Quiz} from "./entity/Quiz";
import {Answer} from "./entity/Answer";
import {Achievement} from "./entity/Achievement";
import {DailyScore} from "./entity/DailyScore";
import {SkillLevel} from "./entity/SkillLevel";
import {Helpers} from "./Helpers";
import { ApolloServer } from "apollo-server";
import * as fs from 'fs';

const PORT = process.env.PORT || 4000;

TypeORM.useContainer(Container);

// connection settings are in the "ormconfig.json" file
TypeORM.createConnection().then(async connection => {
  if (!await connection.manager.findOne(Badge)) {
    // Badges
    const badges = new Array<Badge>();
    await Helpers.asyncForEach(JSON.parse(fs.readFileSync('data/badges.json').toString()), async b => {
      const badge = connection.getMetadata(b.type).create();
      badge.label = b.label;
      badge.levels = b.levels;
      badges.push(badge);
      await connection.manager.save(badge);
    });
    console.log('Populated badges');

    // Courses
    await Helpers.asyncForEach(fs.readdirSync('data/courses'), async cf => {
      const c = JSON.parse(fs.readFileSync(`data/courses/${cf}`).toString());
      const course = new Course();
      course.label = c.label;
      await connection.manager.save(course);
      await Helpers.asyncForEach(c.skills, async s => {
        const skill = new Skill();
        skill.course = course;
        skill.label = s.label;
        skill.description = s.description;
        skill.prerequisites = [];
        await Helpers.asyncForEach(s.prerequisites, async p => {
          skill.prerequisites.push(await connection.manager.findOne(Skill, { label: p, course }));
        });
        await connection.manager.save(skill);
        await Helpers.asyncForEach(s.questions, async q => {
          const question = connection.getMetadata(q.type).create();
          question.skill = skill;
          question.level = q.level;
          question.difficulty = q.difficulty;
          question.config = q.config;
          await connection.manager.save(question);
        });
      });
    });
    console.log('Populated courses');

    // Students
    await Helpers.asyncForEach(fs.readdirSync('data/students'), async sf => {
      const s = JSON.parse(fs.readFileSync(`data/students/${sf}`).toString());
      const student = new Student();
      student.name = s.name;
      student.goal = s.goal;
      student.following = [];
      await Helpers.asyncForEach(s.following, async f => {
        student.following.push(await connection.manager.findOne(Student, { name: f }));
      });
      await connection.manager.save(student);
      const dailyScores = new Map<string, DailyScore>();
      await Helpers.asyncForEach(s.enrollments, async e => {
        const enrollment = new Enrollment();
        enrollment.student = student;
        enrollment.course = await connection.manager.findOne(Course, { label: e.course });
        enrollment.enrolled = new Date(e.enrolled);
        await connection.manager.save(enrollment);
        await Helpers.asyncForEach(e.quizzes, async q => {
          const quiz = new Quiz();
          quiz.enrollment = enrollment;
          quiz.level = q.level;
          quiz.skill = await connection.manager.findOne(Skill, { label: q.skill, course: enrollment.course });
          quiz.started = new Date(q.answers[0].started); // assuming answers are chronological in json
          quiz.completed = new Date(q.answers[q.answers.length-1].completed);
          quiz.answers = [];
          const questions = await connection.manager.find(Question, { skill: quiz.skill, level: quiz.level });
          await Helpers.asyncForEach(q.answers, async a => {
            const answer = new Answer();
            answer.quiz = quiz;
            answer.enrollment = enrollment;
            answer.question = questions[a.question];
            answer.started = new Date(a.started);
            answer.completed = new Date(a.completed);
            answer.answer = a.answer;
            // Object destructuring ftw
            // https://www.reddit.com/r/javascript/comments/8m1kkk/is_object_destructuring_into_properties_of/dzk1uf7/
            ({best: answer.best, correct: answer.correct} = answer.question.evaluate(answer.answer));
            quiz.answers.push(answer);
          });
          await connection.manager.save(quiz);

          // Update skill levels if needed.
          if (0 == await enrollment.missingQuestionsForSkillLevel(quiz.skill, quiz.level)) {
            const skillLevel = new SkillLevel();
            skillLevel.enrollment = enrollment;
            skillLevel.achieved = quiz.completed;
            skillLevel.level = quiz.level;
            skillLevel.skill = quiz.skill;
            await connection.manager.save(skillLevel);
          }

          // Update daily score with this quiz.
          const dateString = DateUtils.mixedDateToDateString(quiz.completed);
          const dailyScore = dailyScores.get(dateString) || new DailyScore();
          dailyScore.student = student;
          dailyScore.date = quiz.completed;
          dailyScore.goal = student.goal;
          dailyScore.score += await quiz.score();
          dailyScores.set(dateString, dailyScore);
        });
      });

      // Student scores.
      await Helpers.asyncForEach([...dailyScores.values()], async dailyScore => {
        await connection.manager.save(dailyScore);

        // Student badges - check each day.
        await Helpers.asyncForEach(badges, async badge => {
          const level = await badge.earned(student, dailyScore.date);
          if (level > 0) {
            const achievement = new Achievement();
            achievement.student = student;
            achievement.badge = badge;
            achievement.level = level;
            achievement.obtained = dailyScore.date;
            await connection.manager.save(achievement);
          }
        });
      });
    });
    console.log('Populated students with daily scores, skill levels and achievements');
  }

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
    console.log(`Available Spanish skills for Caio: `, skills.map(s => s.label));
    const quiz = await enrollment.quiz(skills[0]);
    console.log(`Next Spanish quiz for Caio: `, quiz);
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
    console.log(`Available Portuguese skills for Karim: `, skills.map(s => s.label));
    const quiz = await enrollment.quiz(skills[0]);
    console.log(`Next Portuguese quiz for Karim: `, quiz);
  })();

  // Start GraphQL server.
  const schema = await TypeGraphQL.buildSchema({
    resolvers: [CourseResolver],
  });

  // Create the GraphQL server
  const server = new ApolloServer({
    schema,
    playground: true,
  });

  // Start the server
  const { url } = await server.listen(PORT);
  console.log(`Server is running, GraphQL Playground available at ${url}`);

}).catch(error => console.error("Error: ", error));
