import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Faculty } from './faculty';

@ChildEntity()
export class Student extends User {
  @ManyToOne(() => Faculty)
  @JoinColumn({ name: 'facultyId' })
  faculty!: Faculty;

  @Column('int')
  groupNumber!: number;

  @Column('int')
  course!: number;
}