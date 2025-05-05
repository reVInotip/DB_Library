import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Department } from './department';
import { ScientificDegree } from './scientific_degree';
import { Title } from './title';

@ChildEntity()
export class Teacher extends User {
  @ManyToOne(() => Department)
  @JoinColumn({ name: 'departmentId' })
  department!: Department;

  @ManyToOne(() => ScientificDegree)
  @JoinColumn({ name: 'degreeId' })
  scientificDegree!: ScientificDegree;

  @ManyToOne(() => Title)
  @JoinColumn({ name: 'titleId' })
  title!: Title;
}