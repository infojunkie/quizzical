import {createConnection} from "typeorm";
import {DateUtils} from 'typeorm/util/DateUtils';
import {Course} from "./entity/Course";
import {Skill} from "./entity/Skill";
import {Question} from "./entity/Question";
import {Badge} from "./entity/Badge";
import {Student} from "./entity/Student";
import {Enrollment} from "./entity/Enrollment";
import {Quiz} from "./entity/Quiz";
import {Answer} from "./entity/Answer";
import {Achievement} from "./entity/Achievement";
import {DailyScore} from "./entity/DailyScore";
import * as fs from 'fs';

// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
  if (!array) return;
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// connection settings are in the "ormconfig.json" file
createConnection().then(async connection => {
  // Badges
  const badges = new Array<Badge>();
  await asyncForEach(JSON.parse(fs.readFileSync('data/badges.json').toString()), async b => {
    const badge = connection.getMetadata(b.type).create();
    badge.label = b.label;
    badge.levels = b.levels;
    badges.push(badge);
    await connection.manager.save(badge);
  });
  console.log('Populated badges');

  // Courses
  await asyncForEach(fs.readdirSync('data/courses'), async cf => {
    const c = JSON.parse(fs.readFileSync(`data/courses/${cf}`).toString());
    const course = new Course();
    course.label = c.label;
    await connection.manager.save(course);
    await asyncForEach(c.skills, async s => {
      const skill = new Skill();
      skill.course = course;
      skill.label = s.label;
      skill.description = s.description;
      skill.prerequisites = [];
      await asyncForEach(s.prerequisites, async p => {
        skill.prerequisites.push(await connection.manager.findOne(Skill, { label: p, course }));
      });
      await connection.manager.save(skill);
      await asyncForEach(s.questions, async q => {
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
  await asyncForEach(fs.readdirSync('data/students'), async sf => {
    const s = JSON.parse(fs.readFileSync(`data/students/${sf}`).toString());
    const student = new Student();
    student.name = s.name;
    student.goal = s.goal;
    student.following = [];
    await asyncForEach(s.following, async f => {
      student.following.push(await connection.manager.findOne(Student, { name: f }));
    });
    await connection.manager.save(student);
    const dailyScores = new Map<string, DailyScore>();
    await asyncForEach(s.enrollments, async e => {
      const enrollment = new Enrollment();
      enrollment.student = student;
      enrollment.course = await connection.manager.findOne(Course, { label: e.course });
      enrollment.enrolled = new Date(e.enrolled);
      await connection.manager.save(enrollment);
      await asyncForEach(e.quizzes, async q => {
        const quiz = new Quiz();
        quiz.enrollment = enrollment;
        quiz.level = q.level;
        quiz.skill = await connection.manager.findOne(Skill, { label: q.skill, course: enrollment.course });
        quiz.started = new Date(q.answers[0].started); // assuming answers are chronological in json
        quiz.completed = new Date(q.answers[q.answers.length-1].completed);
        await connection.manager.save(quiz);
        const questions = await connection.manager.find(Question, { skill: quiz.skill, level: quiz.level });
        await asyncForEach(q.answers, async a => {
          const answer = new Answer();
          answer.quiz = quiz;
          answer.question = questions[a.question];
          answer.started = new Date(a.started);
          answer.completed = new Date(a.completed);
          answer.answer = a.answer;
          // Object destructuring ftw
          // https://www.reddit.com/r/javascript/comments/8m1kkk/is_object_destructuring_into_properties_of/dzk1uf7/
          ({passed: answer.passed, correct: answer.correct} = answer.question.evaluate(answer.answer));
          await connection.manager.save(answer);
        });

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
    await asyncForEach([...dailyScores.values()], async dailyScore => {
      await connection.manager.save(dailyScore);

      // Student badges - check each day.
      await asyncForEach(badges, async badge => {
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
  console.log('Populated students with daily scores and achievements');

  process.exit(0);
}).catch(error => console.error("Error: ", error));
