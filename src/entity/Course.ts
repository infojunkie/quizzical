import 'reflect-metadata';
import {Field, ObjectType} from 'type-graphql';
import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Skill} from './Skill';

@Entity()
@ObjectType()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Field()
  label: string;

  @OneToMany(type => Skill, skill => skill.course)
  skills: Skill[];
}
