import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRegisteredPayload } from '@online-store/shared-types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const profile = await this.userRepository.findById(userId);
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    const profile = await this.userRepository.findById(userId);
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return this.userRepository.update(userId, dto);
  }

  async handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
    await this.userRepository.create(payload.userId, payload.email);
  }
}
