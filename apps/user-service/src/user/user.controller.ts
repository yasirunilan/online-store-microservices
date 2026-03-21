import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@online-store/shared-middleware';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserService } from './user.service';

interface AuthenticatedRequest {
  user: { userId: string; email: string };
}

@ApiTags('users')
@ApiBearerAuth()
@Controller({ version: '1', path: 'users' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getMe(@Request() req: AuthenticatedRequest): Promise<UserProfileDto> {
    return this.userService.getProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  updateMe(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateProfile(req.user.userId, dto);
  }
}
