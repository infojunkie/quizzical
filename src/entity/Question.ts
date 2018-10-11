import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance
} from 'typeorm';
import {Skill} from './Skill';

export class AnswerEvaluation {
  // Automatic constructor arguments
  // https://www.stevefenton.co.uk/2013/04/Stop-Manually-Assigning-TypeScript-Constructor-Parameters/
  constructor(public passed: boolean, public correct: any) {}
}

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Skill, skill => skill.questions)
  skill: Skill;

  @Column()
  level: number;

  @Column()
  difficulty: number;

  @Column("simple-json")
  config: any;

  /**
   * Overridable function to evaluate an answer.
   * Most question types store the correct answer as plain text in `config.answer`.
   */
  evaluate(answer: any): AnswerEvaluation {
    return new AnswerEvaluation(
      Question.normalize(this.config.answer) === Question.normalize(answer),
      this.config.answer
    );
  }

  /**
   * Text normalization utility.
   */
  protected static normalize(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
}
