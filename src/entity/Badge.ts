import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ default: "" })
  description: string;

  @Column("simple-array")
  levels: string[];
}
