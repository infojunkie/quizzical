import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance
} from 'typeorm';
import normalize from 'nlcst-normalize';
import {Skill} from './Skill';

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

  // Most question types store the correct answer in `config.answer`
  evaluate(answer: any) {
    return Question.normalizeText(this.config.answer) === Question.normalizeText(answer);
  }

  protected static normalizeText(text: string) {
    return normalize(text);
  }
}
