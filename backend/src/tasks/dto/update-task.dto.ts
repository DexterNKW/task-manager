import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsISO8601, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTaskDto {
  @IsOptional()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
