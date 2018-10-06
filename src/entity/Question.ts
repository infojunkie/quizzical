import {Column, Entity, JoinTable, OneToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Skill} from './Skill';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Skill, skill => skill.questions)
  skill: Skill;

  @Column()
  level: number;

  @Column()
  difficulty: number;

  // https://www.duolingo.com/design/
  @Column("enum", { enum: [
      "assemble", // "Tap" on Duolingo
      "speak",
      "translate",
      "fill",
      "match",
      "select",
      "assist",
      "name",
      "listen",
      "judge",
      "word-smash", // Duolingo clubs
      "caption",
      "scenario",
      "listen-answer",
      "use",
      "club-chat"
  ] } )
  type: string;

  @Column("json")
  config: any;
}
