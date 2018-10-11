import {Column, Entity, PrimaryGeneratedColumn, TableInheritance} from 'typeorm';
import {Student} from './Student';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ default: "" })
  description: string;

  @Column("simple-array")
  levels: string[];

  /**
   * Overridable function to check whether a student has earned a badge.
   * Each `Badge` subclass implements its own logic.
   */
  async earned(student: Student, date: Date): Promise<number> { return 0; }
}
