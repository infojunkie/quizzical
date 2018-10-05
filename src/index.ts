import {createConnection} from "typeorm";
import {Course} from "./entity/Course";
import {Skill} from "./entity/Skill";
import {Question} from "./entity/Question";
import * as fs from 'fs';

// connection settings are in the "ormconfig.json" file
createConnection().then(async connection => {
    const pt = JSON.parse(fs.readFileSync('data/portuguese.json').toString());
    const course = new Course();
    course.label = pt.label;
    await connection.manager.save(course);
    pt.skills.forEach(async s => {
        const skill = new Skill();
        skill.course = course;
        skill.label = s.label;
        skill.description = s.description;
        await connection.manager.save(skill);
        s.questions.forEach(async q => {
            const question = new Question();
            question.skill = skill;
            question.level = q.level;
            question.difficulty = q.difficulty;
            question.type = q.type;
            question.config = q.config;
            await connection.manager.save(question);
        });
    });
    console.log("Populated database.");
    process.exit(0);
}).catch(error => console.error("Error: ", error));
