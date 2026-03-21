---
name: debug-event
description: Debug a broken async queue event by parallel-inspecting the publisher service, consumer service, and shared-types payload in one shot. Use when an event is published but not received, or when there is a payload mismatch.
argument-hint: <event-pattern> [publisher-service] [consumer-service]
allowed-tools: Glob, Grep, Read
---

# Debug Async Event

Diagnose why a queue event is not flowing correctly by simultaneously inspecting all three touch points.

## Parse arguments

From `$ARGUMENTS`:
- `$0` — event pattern in dot notation (e.g. `order.placed`). Required — stop and ask if missing.
- `$1` — publisher service (e.g. `order-service`). If omitted, search all services for the publisher.
- `$2` — consumer service (e.g. `notification-service`). If omitted, search all services for consumers.

## Parallel investigation

Launch THREE Explore agents in parallel with these focused tasks:

### Agent 1 — Publisher
Search `apps/<publisher-service>/src` (or all `apps/` if service unknown) for:
- The file that calls `client.emit('<event-pattern>', ...)` or `ClientProxy.emit`
- The exact pattern string used — check for typos vs `$0`
- Where the publisher is called from (which service method triggers it)
- Whether the publisher is registered in its module

### Agent 2 — Consumer
Search `apps/<consumer-service>/src` (or all `apps/` if service unknown) for:
- The `@EventPattern(...)` decorator — check the pattern string matches `$0` exactly (case-sensitive)
- Whether the consumer controller is registered in its module's `controllers` array
- Whether the module is imported in `app.module.ts`
- Whether `QueueClientModule` is imported in the consumer's `app.module.ts`

### Agent 3 — Shared types
Search `packages/shared-types/src` for:
- The event name constant (e.g. `ORDER_PLACED = 'order.placed'`)
- The payload interface for this event
- Whether both are exported from `packages/shared-types/src/index.ts`
- Whether publisher and consumer import from `@online-store/shared-types` (not hardcoded strings)

## Report format

After all three agents return, consolidate into a structured diagnosis:

```
## Event: <event-pattern>

### Pattern string
- Constant defined in shared-types: ✅ / ❌ <detail>
- Publisher uses constant (not hardcoded string): ✅ / ❌
- Consumer uses constant (not hardcoded string): ✅ / ❌
- Strings match exactly: ✅ / ❌

### Publisher (<service>)
- File: <path>
- Triggered from: <method>
- Module registration: ✅ / ❌

### Consumer (<service>)
- File: <path>
- @EventPattern value: '<value>'
- Registered in module controllers: ✅ / ❌
- Module imported in app.module.ts: ✅ / ❌
- QueueClientModule imported: ✅ / ❌

### Payload
- Interface: <InterfaceName>
- Exported from shared-types index: ✅ / ❌

### Most likely cause
<1-2 sentence diagnosis of the root issue>

### Fix
<specific files and changes needed>
```

## Rules

- Never suggest code changes without first identifying the root cause
- Pattern string mismatches (even whitespace) are the most common cause — check carefully
- If the event name constant is defined but not used (hardcoded string instead), flag it
- If the consumer module is not in `app.module.ts` imports, the consumer will silently never fire
