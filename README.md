quizzical
---------

A quiz-based, social learning engine like Duolingo.

https://forum.duolingo.com/comment/7285662/Let-s-open-Duolingo-s-source-code

# Usage

```
$ npm i
$ npm start

> quizzical@1.0.0 start /media/kratib/data/src/infojunkie/quizzical
> tsc && node src/index.js

Populated badges
Populated courses
Populated students with daily scores and achievements

$ npm run database

> quizzical@1.0.0 database /media/kratib/data/src/infojunkie/quizzical
> sqlite3 data/quizzical.db || true

SQLite version 3.19.4 2017-08-18 19:28:12
Enter ".help" for usage hints.
sqlite> select * from badge;
1|Wildfire||5-day streak,15-day streak,30-day streak
2|Champion||Completed a course,Conquered a course,Mastered a course
3|Sharpshooter||Completed 1 lessons without getting anything wrong,Completed 4 lessons without getting anything wrong,Completed 10 lessons without getting anything wrong
sqlite> select * from question;
1|1|1|{"target":"the woman","choices":["a mulher","o menino","o homem"],"answer":"a mulher"}|SelectQuestion|1
2|1|1|{"target":"the girl","choices":["a mulher","a menina","o menino"],"answer":"a menina"}|SelectQuestion|1
3|1|1|{"target":"a menina","choices":["I","boy","the","man","The","girl"],"answer":"the girl"}|AssembleQuestion|1
4|1|1|{"target":"the man","choices":["a mulher","o menino","o homem"],"answer":"o homem"}|SelectQuestion|1
5|1|2|{"target":"Eu sou uma menina","choices":["girl","the","boy","man","I","am","woman","a"],"answer":"I am a girl"}|AssembleQuestion|1
6|1|2|{"target":"I am the woman","choices":["Sou a água","Eu sou a mulher","Eu sou a maçã"],"answer":"Eu sou a mulher"}|JudgeQuestion|1
7|1|1|{"target":"the woman","choices":["la mujer","el niño","el hombre"],"answer":"la mujer"}|SelectQuestion|2
8|1|1|{"target":"the girl","choices":["la mujer","la niña","el niño"],"answer":"la niña"}|SelectQuestion|2
9|1|1|{"target":"la niña","choices":["I","boy","the","man","The","girl"],"answer":"the girl"}|AssembleQuestion|2
10|1|1|{"target":"the man","choices":["la mujer","el niño","el hombre"],"answer":"el hombre"}|SelectQuestion|2
11|1|2|{"target":"Yo soy una niña","choices":["girl","the","boy","man","I","am","woman","a"],"answer":"I am a girl"}|AssembleQuestion|2
12|1|2|{"target":"I am the woman","choices":["Soy el agua","Yo soy la mujer","Yo soy la manzana"],"answer":"Yo soy la mujer"}|JudgeQuestion|2
sqlite> select * from answer;
1|"la mujer"|2018-10-05 01:01:23.000|2018-10-05 01:01:34.000|1|"la mujer"|1|7
2|"la niña"|2018-10-05 01:01:45.000|2018-10-05 01:01:56.000|1|"la niña"|1|8
3|"the boy"|2018-10-05 01:02:23.000|2018-10-05 01:02:34.000|0|"the girl"|1|9
4|"a mulher"|2016-01-06 01:01:23.000|2016-01-06 01:01:34.000|1|"a mulher"|2|1
5|"o menino"|2016-01-06 01:01:45.000|2016-01-06 01:01:56.000|0|"a menina"|2|2
6|"the girl"|2016-01-06 01:02:23.000|2016-01-06 01:02:34.000|1|"the girl"|2|3
7|"a menina"|2016-01-06 22:01:23.000|2016-01-06 22:01:34.000|1|"a menina"|3|2
8|"o homem"|2016-01-06 22:01:45.000|2016-01-06 22:01:56.000|1|"o homem"|3|4
9|"I am a girl"|2016-01-06 22:02:23.000|2016-01-06 22:02:34.000|1|"I am a girl"|3|5
10|"Eu sou a mulher"|2016-01-06 22:02:45.000|2016-01-06 22:02:56.000|1|"Eu sou a mulher"|3|6
sqlite> select * from daily_score;
1|2018-10-04|4|3|1
2|2016-01-05|4|3|1
3|2016-01-06|3|3|1
sqlite> select * from achievement;
1|1|2016-01-06|1|1
sqlite> ^D

$ npm run clean

> quizzical@1.0.0 clean /media/kratib/data/src/infojunkie/quizzical
> rm data/quizzical.db

```

# Use cases

- Student starts a course
- Student sees a skills listing; some skills are disabled until a checkpoint is reached
- Student starts a skill
- Student is given a quiz of 10 questions. For Duolingo, quiz=lesson and question=exercise
- Each question is of a certain type. For Duolingo, these types are listed here https://www.duolingo.com/design/
- Upon answering a question successfully, the student makes progress in the quiz and accumulates a score. Successful first-time answers get a higher score.
- A student can report a question or discuss it if it is unclear or otherwise needs improvement
- The quiz is not complete until all questions are answered successfully
- Upon completing a quiz, the student progresses in the skill. A skill has levels. To complete a level, a certain number of quizzes must be completed. The difficulty of a quiz corresponds to a skill level.
- A student can jump out of a skill level to the next by taking a special quiz which is made of the most difficult questions for the current level.
- The student accumulates points by completing quizzes. A student has a daily goal of points earned. The student's streak is monitored - that is, the number of consecutive days of achieving the daily goal.
- The student obtains badges by satisfying a set of conditions that is specific to each badge
- The student earns more points by answering open-ended questions in forums
- Upon reaching a daily goal, the student can play a game to earn more points

# Model

```
course: {
  label: text
  skills: [{
    label: text
    description: text
    prerequisites: [ref(skill)] // assuming a prerequisite is satisfied when a level 1 is achieved
    questions: [{
      level: int
      difficulty: int
      type: enum // type of question among available types
      config: json // question structure depends on its type

      // given an answer, evaluate if it passes or fails and return closest correct answer
      evaluate: (answer: json) => { passed: boolean, correct: json }
    }]
  }]
}

quiz: {
  student: ref(student)
  skill: ref(skill)
  level: int
  answers: [{
    question: ref(question)
    answer: json // answer structure depends on the type of question
    started: timestamp // time at which the question was started by the student
    submitted: timestamp // time at whice the answer was submitted by the student
    passed: boolean
    correct: json
  }]

  // get the score of a student for their quiz answers
  score: student => int
}

student: {
  name: text
  goal: int // current daily goal measured in points
  enrollments: [{
    course: ref(course)
    enrolled: timestamp
    quizzes: [quiz]
  }]
  scores: [{
    day: date
    score: int
  }]
  achievements: [{
    badge: ref(badge)
    level: int
    obtained: date
  }]

  // get the streak of a student on a given day
  streak: date => int
}

badge: {
  label: text
  levels: [text]

  // check whether the given student has earned the badge on a given day, and return the badge level
  earned: student, date => int
}
```
