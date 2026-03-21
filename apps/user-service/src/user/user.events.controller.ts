import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserRegisteredPayload } from '@online-store/shared-types';
import { UserService } from './user.service';

@Controller()
export class UserEventsController {
  constructor(private readonly userService: UserService) {}

  @EventPattern('user.registered')
  handleUserRegistered(@Payload() payload: UserRegisteredPayload): Promise<void> {
    return this.userService.handleUserRegistered(payload);
  }
}
