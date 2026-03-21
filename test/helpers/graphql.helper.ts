import { productClient } from './http.helper';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: any }>;
}

export async function gql<T = any>(
  query: string,
  variables?: Record<string, any>,
  headers?: Record<string, string>,
): Promise<GraphQLResponse<T>> {
  const res = await productClient.post(
    '/graphql',
    { query, variables },
    { headers },
  );
  return res.data;
}
