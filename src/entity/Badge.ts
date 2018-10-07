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

  async earned(student: Student, date: Date): Promise<number> { return 0; }
}
