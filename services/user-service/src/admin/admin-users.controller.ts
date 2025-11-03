import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

// Note: Import these guards from your auth setup
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/users')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN', 'SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // ==================== USER MANAGEMENT ====================

  @Get()
  async getAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminUsersService.getAllUsers({
      search,
      role,
      isActive: isActive ? isActive === 'true' : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  async getUserStats() {
    return this.adminUsersService.getUserStats();
  }

  @Get('growth')
  async getUserGrowth(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('days') days?: string,
  ) {
    return this.adminUsersService.getUserGrowth(
      period || 'daily',
      days ? parseInt(days) : 30,
    );
  }

  @Get('active')
  async getActiveUsers(@Query('minutes') minutes?: string) {
    return this.adminUsersService.getActiveUsers(minutes ? parseInt(minutes) : 60);
  }

  @Get(':id')
  async getUserDetails(@Param('id') userId: string) {
    return this.adminUsersService.getUserDetails(userId);
  }

  @Patch(':id/suspend')
  async suspendUser(
    @Param('id') userId: string,
    @Body() dto: { reason: string; adminId: string },
  ) {
    return this.adminUsersService.suspendUser(userId, dto.reason, dto.adminId);
  }

  @Patch(':id/reactivate')
  async reactivateUser(@Param('id') userId: string, @Body() dto: { adminId: string }) {
    return this.adminUsersService.reactivateUser(userId, dto.adminId);
  }

  @Patch(':id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: { role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN'; adminId: string },
  ) {
    return this.adminUsersService.updateUserRole(userId, dto.role, dto.adminId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') userId: string, @Body() dto: { adminId: string }) {
    return this.adminUsersService.deleteUser(userId, dto.adminId);
  }
}
