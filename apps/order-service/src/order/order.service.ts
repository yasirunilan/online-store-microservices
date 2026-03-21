import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { QUEUE_CLIENT } from '@online-store/queue-client';
import {
  ORDER_PLACED,
  ORDER_STATUS_UPDATED,
  OrderPlacedPayload,
  OrderStatusUpdatedPayload,
} from '@online-store/shared-types';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService implements OnModuleInit {
  constructor(
    private readonly orderRepository: OrderRepository,
    @Inject(QUEUE_CLIENT) private readonly queueClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queueClient.connect();
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = await this.orderRepository.create({
      userId,
      email: dto.email,
      totalAmount,
      items: dto.items,
    });

    const payload: OrderPlacedPayload = {
      orderId: order.id,
      userId,
      email: dto.email,
      items: dto.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
      placedAt: order.createdAt.toISOString(),
    };
    this.queueClient.emit(ORDER_PLACED, payload);

    return order;
  }

  async getOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getMyOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    const updated = await this.orderRepository.updateStatus(id, dto.status);

    const payload: OrderStatusUpdatedPayload = {
      orderId: id,
      userId: order.userId,
      email: order.email,
      previousStatus,
      newStatus: dto.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
    this.queueClient.emit(ORDER_STATUS_UPDATED, payload);

    return updated;
  }
}
