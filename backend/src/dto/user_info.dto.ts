import { Department } from "../model/entities/user/department";
import { Faculty } from "../model/entities/user/faculty";
import { Role } from "../model/entities/user/role";
import { ScientificDegree } from "../model/entities/user/scientific_degree";
import { Title } from "../model/entities/user/title";
import { User } from "../model/entities/user/user";

export class UserInfoDto {
  department: string;
  faculty: string;
  course: number;
  group: number;
}

export class UserDto {
  name: string;
  secondName: string;
  patronymic: string;
  email: string;
  password: string;
  roleId: number;
}

export class StudentDto extends UserDto {
  facultyId: number;
  course: number;
  group: number;
}

export class TeacherDto extends UserDto {
  departmentId: number;
  degreeId: number;
  titleId: number;
}

export class ReadersWithCountDto {
  readers: User[];
  totalCount: number;
}