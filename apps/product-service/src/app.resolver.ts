import { Query, Resolver } from '@nestjs/graphql';

// Placeholder resolver — required so GraphQL autoSchemaFile has at least one query on startup.
// Remove this when real product resolvers are added in Phase 5.
@Resolver()
export class AppResolver {
  @Query(() => String)
  healthCheck(): string {
    return 'ok';
  }
}
