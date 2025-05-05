import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Teacher } from "./teacher";

@Entity()
export class ScientificDegree {
    @PrimaryGeneratedColumn()
    degreeId!: number;

    @Column({ length: 50 })
    degreeName!: string;

    @OneToMany(() => Teacher, teacher => teacher.scientificDegree)
    teachers!: Teacher[];
}