---
name: add-event
description: Add a new async queue event across all affected services — shared-types payload, publisher, and consumer. Use when introducing a new event-driven integration between services.
argument-hint: <event-name> <publisher-service> <consumer-service>
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Async Queue Event

Wire up a new event end-to-end: payload type in `shared-types`, publisher in the source service, consumer in the target service.

## Parse arguments

From `$ARGUMENTS`:
- `$0` — event name in dot notation (e.g. `order.placed`, `user.registered`). Required.
- `$1` — publisher service in kebab-case (e.g. `order-service`). Required.
- `$2` — consumer service in kebab-case (e.g. `notification-service`). Required.

If any argument is missing, stop and ask before proceeding.

## Naming conventions

Given event name `order.placed`:
- Queue name constant: `ORDER_PLACED` (in `shared-types`)
- Payload interface: `OrderPlacedPayload` (in `shared-types`)
- Publisher file: `apps/order-service/src/events/publishers/orderPlaced.publisher.ts`
- Consumer file: `apps/notification-service/src/events/consumers/orderPlaced.consumer.ts`

## Steps

### 1. Define the payload in `shared-types`

Add to `packages/shared-types/src/events/<domain>.events.ts` (create file if needed):

```typescript
// Queue name constant
export const ORDER_PLACED = 'order.placed'

// Payload interface — include all fields the consumer will need
// so it never has to call back to the publisher service
export interface OrderPlacedPayload {
  orderId: string
  userId: string
  userEmail: string
  totalAmount: number
  items: Array<{ productId: string; name: string; quantity: number; price: number }>
  createdAt: string // ISO 8601
}
```

Export the new types from `packages/shared-types/src/index.ts`.

### 2. Create the publisher

`apps/<publisher-service>/src/events/publishers/<eventName>.publisher.ts`:

```typescript
import { queueClient } from '@online-store/queue-client'
import { ORDER_PLACED, OrderPlacedPayload } from '@online-store/shared-types'

export async function publishOrderPlaced(payload: OrderPlacedPayload): Promise<void> {
  await queueClient.publish(ORDER_PLACED, payload)
}
```

Call this publisher from the appropriate service method (e.g. after saving the order to DB). Read the relevant service file first and add the call in the right place.

### 3. Create the consumer

`apps/<consumer-service>/src/events/consumers/<eventName>.consumer.ts`:

```typescript
import { queueClient } from '@online-store/queue-client'
import { ORDER_PLACED, OrderPlacedPayload } from '@online-store/shared-types'
import { logger } from '@online-store/shared-logger'

export function registerOrderPlacedConsumer(): void {
  queueClient.subscribe<OrderPlacedPayload>(ORDER_PLACED, async (payload) => {
    logger.info({ orderId: payload.orderId }, 'Handling order.placed event')
    // TODO: implement handler logic
  })
}
```

Register the consumer in `apps/<consumer-service>/src/app.ts` at startup — find the bootstrap function and add the `register*Consumer()` call.

### 4. Confirm

List all files created or modified and summarise what the user still needs to do (fill in the handler logic, add any new env vars, etc.).

## Rules

- Payload interfaces must be self-contained — include denormalised fields (e.g. `userEmail`) so the consumer never needs to call back to another service
- All dates in payloads must be ISO 8601 strings, not `Date` objects (queues are JSON)
- Consumers must log on entry with relevant IDs for traceability
- Never publish events directly with `queueClient` from a controller or service — always go through the publisher file
- The queue name string (e.g. `'order.placed'`) must only be defined once, in `shared-types`
