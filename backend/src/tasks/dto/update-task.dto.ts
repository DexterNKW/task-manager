import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsISO8601 } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;
}
