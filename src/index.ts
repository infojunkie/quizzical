import {createConnection} from "typeorm";
import {Course} from "./entity/Course";
import {Skill} from "./entity/Skill";
import {Question} from "./entity/Question";
import {Badge} from "./entity/Badge";
import {Student} from "./entity/Student";
import {Enrollment} from "./entity/Enrollment";
import {Quiz} from "./entity/Quiz";
import {Answer} from "./entity/Answer";
import * as fs from 'fs';

// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// connection settings are in the "ormconfig.json" file
createConnection().then(async connection => {
  // Badges
  await asyncForEach(JSON.parse(fs.readFileSync('data/badges.json').toString()), async b => {
    const badge = new Badge();
    badge.label = b.label;
    badge.levels = b.levels;
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
    await connection.manager.save(student);
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
        await connection.manager.save(quiz);
        const questions = await connection.manager.find(Question, { skill: quiz.skill, level: quiz.level });
        await asyncForEach(q.answers, async a => {
          const answer = new Answer();
          answer.quiz = quiz;
          answer.question = questions[a.question];
          answer.started = new Date(a.started);
          answer.submitted = new Date(a.submitted);
          answer.answer = a.answer;
          await connection.manager.save(answer);
          // TODO answer.passed
        });
      });
      // TODO enrollment.scores
    });
    // TODO student.achievements
  });
  console.log('Populated students');

  process.exit(0);
}).catch(error => console.error("Error: ", error));
