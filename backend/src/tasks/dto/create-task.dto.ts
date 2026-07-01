import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}