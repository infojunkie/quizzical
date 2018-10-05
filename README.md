quizzical
---------

A quiz-based, social learning engine like Duolingo.

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

      // generate a question statement
      render: () => text

      // given an answer, evaluate if it passes or fails and return closest correct answer
      evaluate: json => boolean, json
    }]
  }]
}

model: {

  // get the skill level of a student
  level: student, skill => int

  // generate a new quiz for a given student for a given skill
  quiz: student, skill => quiz

  // get the score of a student for their quiz answers
  score: student, quiz => int

  // get the streak of a student in a given course
  streak: student, course => int
}

quiz: {
  student: ref(student)
  skill: ref(skill)
  level: int
  answers: [{
    question: ref(question)
    answer: json // answer structure depends on the type of question
    started: timestamp // time at which the question was started by the student
    answered: timestamp // time at whice the answer was submitted by the student
    passed: boolean
  }]
}

student: {
  name: text
  courses: [{
    course: ref(course)
    enrolled: timestamp
    goal: int // current daily goal
    scores: [{ // current scores
      tally: enum(total, daily, weekly)
      points: int
    }]
    skills: [{ // current skill levels
      skill: ref(skill)
      level: int
    }]
    history: [quiz]
  }]
  badges: [ref(badge)] // earned badges
}

badge: {
  label: text
  earned: student => boolean // check whether the given student has earned the badge
}
```
