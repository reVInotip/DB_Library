import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Department } from './department';
import { ScientificDegree } from './scientific_degree';
import { Title } from './title';

@ChildEntity()
export class Teacher extends User {
  @ManyToOne(() => Department, department => department.teachers)
  @JoinColumn({ name: 'departmentId' })
  department!: Department;

  @ManyToOne(() => ScientificDegree, degree => degree.teachers)
  @JoinColumn({ name: 'degreeId' })
  scientificDegree!: ScientificDegree;

  @ManyToOne(() => Title, title => title.teachers)
  @JoinColumn({ name: 'titleId' })
  title!: Title;
}