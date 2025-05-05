import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Student } from './student';

@Entity()
export class Faculty {
  @PrimaryGeneratedColumn()
  facultyId!: number;

  @Column({ length: 50 })
  facultyName!: string;

  @OneToMany(() => Student, student => student.faculty)
  students!: Student[];
}