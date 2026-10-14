import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { PublicUser } from '../users/user.entity';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: PublicUser) {
    return this.tasksService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.tasksService.remove(user.id, id);
  }
}
