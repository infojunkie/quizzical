import 'reflect-metadata';
import { Resolver, Query } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

import { Course } from '../entity/Course';

@Resolver(of => Course)
export class CourseResolver {
  constructor(
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
  ) {}

  @Query(returns => [Course])
  courses(): Promise<Course[]> {
    return this.courseRepository.find();
  }
}
