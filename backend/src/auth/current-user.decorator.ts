import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { PublicUser } from '../users/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser =>
    ctx.switchToHttp().getRequest<Request & { user: PublicUser }>().user,
);
