import { Module } from '@nestjs/common';
import { SharedMiddlewareModule } from '@online-store/shared-middleware';
import { UserController } from './user.controller';
import { UserEventsController } from './user.events.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [SharedMiddlewareModule],
  controllers: [UserController, UserEventsController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
