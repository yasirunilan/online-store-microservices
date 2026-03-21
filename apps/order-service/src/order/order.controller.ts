import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@online-store/shared-middleware';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

interface AuthenticatedRequest {
  user: { userId: string; email: string };
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ version: '1', path: 'orders' })
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(req.user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my orders' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  getMyOrders(@Request() req: AuthenticatedRequest) {
    return this.orderService.getMyOrders(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrder(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto);
  }
}
