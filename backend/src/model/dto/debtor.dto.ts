export class DebtorFilterDto {
    pointId?: number;
    faculty?: string;
    department?: string;
    course?: number;
    group?: number;
    category?: string;
}

export class DebtorResultDto {
    userId: number;
    username: string;
    userSecondName: string;
    facultyName?: string;
    departmentName?: string;
    groupNumber?: number;
    course?: number;
    categoryName: string;
    daysOverdue: number;
}

export class DebtorsWithCountDto {
    debtors: DebtorResultDto[];
    totalCount: number;
}