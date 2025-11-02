import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() updateData: any) {
    return this.usersService.updateProfile(user.id, updateData);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: any,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.changePassword(user.id, oldPassword, newPassword);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  // Address endpoints
  @Get('me/addresses')
  getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  createAddress(@CurrentUser() user: any, @Body() addressData: any) {
    return this.usersService.createAddress(user.id, addressData);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() addressData: any,
  ) {
    return this.usersService.updateAddress(user.id, addressId, addressData);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(user.id, addressId);
  }

  @Patch('me/addresses/:id/default')
  setDefaultAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.setDefaultAddress(user.id, addressId);
  }

  // Wallet endpoints
  @Get('me/wallet')
  getWalletBalance(@CurrentUser() user: any) {
    return this.usersService.getWalletBalance(user.id);
  }

  @Get('me/wallet/transactions')
  getWalletTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getWalletTransactions(
      user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
