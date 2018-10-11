quizzical
---------

A quiz-based learning engine like Duolingo or Quizlet.

https://forum.duolingo.com/comment/7285662/Let-s-open-Duolingo-s-source-code

# Usage

```
$ npm i
$ npm start

> tsc && node src/index.js

> quizzical@1.0.0 start /media/kratib/data/src/infojunkie/quizzical
> tsc && node src/index.js

Populated badges
Populated courses
Populated students with daily scores, skill levels and achievements
Available Spanish skills for Caio:  [ 'Basics 1' ]
Next Spanish quiz for Caio:  Quiz { ... }
Available Portuguese skills for Karim:  [ 'Basics 1', 'Basics 2' ]
Next Portuguese quiz for Karim:  Quiz { ... }

$ npm run database

> quizzical@1.0.0 database /media/kratib/data/src/infojunkie/quizzical
> sqlite3 data/quizzical.db || true

SQLite version 3.11.0 2016-02-15 17:29:24
Enter ".help" for usage hints.
sqlite> .header on
sqlite> select * from daily_score;
id|date|score|goal|studentId
1|2017-06-05|2|10|1
2|2018-10-04|4|3|2
3|2016-01-05|4|3|2
4|2016-01-06|3|3|2
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

student: {
  name: text
  goal: int // current daily goal measured in points
  following: [ref(student)]
  enrollments: [{
    course: ref(course)
    enrolled: datetime
    quizzes: [{
      skill: ref(skill)
      level: int
      started: datetime
      completed: datetime
      answers: [{
        question: ref(question)
        answer: json // answer structure depends on the type of question
        started: datetime // time at which the question was started by the student
        completed: datetime // time at whice the answer was submitted by the student
        passed: boolean
        correct: json
      }]

      score: () => int
    }]
  }]
  scores: [{
    date: date
    score: int
    goal: int // student goal on that day
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
