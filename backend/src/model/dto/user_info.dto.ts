import { User } from "../entities/user/user";

export class UserInfoDto {
    department: string;
    faculty: string;
    course: number;
    group: number;
}

export class ReadersWithCountDto {
  readers: User[];
  totalCount: number;
}