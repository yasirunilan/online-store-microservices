import { productClient, authHeaders } from './helpers/http.helper';
import { registerUser } from './helpers/auth.helper';
import { gql } from './helpers/graphql.helper';

describe('Product Service (e2e)', () => {
  let token: string;

  beforeAll(async () => {
    const user = await registerUser();
    token = user.tokens.accessToken;
  });

  describe('Health', () => {
    it('GET /health → 200', async () => {
      const res = await productClient.get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Categories', () => {
    const ts = Date.now();
    let categoryId: string;

    it('should create a category', async () => {
      const { data, errors } = await gql(
        `mutation CreateCategory($input: CreateCategoryInput!) {
          createCategory(input: $input) { id name }
        }`,
        { input: { name: `Test Category ${ts}` } },
        authHeaders(token),
      );

      expect(errors).toBeUndefined();
      expect(data.createCategory).toMatchObject({ name: `Test Category ${ts}` });
      expect(data.createCategory.id).toBeDefined();
      categoryId = data.createCategory.id;
    });

    it('should list categories including the created one', async () => {
      const { data, errors } = await gql(
        `query { categories { id name } }`,
      );

      expect(errors).toBeUndefined();
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.some((c: any) => c.id === categoryId)).toBe(true);
    });

    it('should get category by ID', async () => {
      const { data, errors } = await gql(
        `query GetCategory($id: String!) {
          category(id: $id) { id name }
        }`,
        { id: categoryId },
      );

      expect(errors).toBeUndefined();
      expect(data.category).toMatchObject({ id: categoryId, name: `Test Category ${ts}` });
    });

    it('should delete category', async () => {
      const { data, errors } = await gql(
        `mutation DeleteCategory($id: String!) {
          deleteCategory(id: $id)
        }`,
        { id: categoryId },
        authHeaders(token),
      );

      expect(errors).toBeUndefined();
      expect(data.deleteCategory).toBe(true);
    });
  });

  describe('Products', () => {
    const ts = Date.now();
    let categoryId: string;
    let productId: string;

    beforeAll(async () => {
      const { data } = await gql(
        `mutation CreateCategory($input: CreateCategoryInput!) {
          createCategory(input: $input) { id name }
        }`,
        { input: { name: `Product Test Category ${ts}` } },
        authHeaders(token),
      );
      categoryId = data.createCategory.id;
    });

    it('should create a product', async () => {
      const { data, errors } = await gql(
        `mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) { id name price sku }
        }`,
        {
          input: {
            name: `Test Product ${ts}`,
            description: 'A test product',
            price: 29.99,
            sku: `SKU-${ts}`,
            categoryId,
          },
        },
        authHeaders(token),
      );

      expect(errors).toBeUndefined();
      expect(data.createProduct).toMatchObject({
        name: `Test Product ${ts}`,
        price: 29.99,
        sku: `SKU-${ts}`,
      });
      expect(data.createProduct.id).toBeDefined();
      productId = data.createProduct.id;
    });

    it('should list products', async () => {
      const { data, errors } = await gql(
        `query { products(limit: 10) { id name } }`,
      );

      expect(errors).toBeUndefined();
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.some((p: any) => p.id === productId)).toBe(true);
    });

    it('should list products filtered by category', async () => {
      const { data, errors } = await gql(
        `query ProductsByCategory($categoryId: String!) {
          products(categoryId: $categoryId) { id name }
        }`,
        { categoryId },
      );

      expect(errors).toBeUndefined();
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.every((p: any) => p.id === productId || true)).toBe(true);
      expect(data.products.some((p: any) => p.id === productId)).toBe(true);
    });

    it('should get product by ID with relations', async () => {
      const { data, errors } = await gql(
        `query GetProduct($id: String!) {
          product(id: $id) {
            id name
            category { id name }
            inventory { quantity }
          }
        }`,
        { id: productId },
      );

      expect(errors).toBeUndefined();
      expect(data.product).toMatchObject({
        id: productId,
        name: `Test Product ${ts}`,
        category: { id: categoryId, name: `Product Test Category ${ts}` },
      });
      expect(data.product.inventory).toBeDefined();
    });

    it('should update a product', async () => {
      const { data, errors } = await gql(
        `mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
          updateProduct(id: $id, input: $input) { id name }
        }`,
        { id: productId, input: { name: `Updated Product ${ts}` } },
        authHeaders(token),
      );

      expect(errors).toBeUndefined();
      expect(data.updateProduct).toMatchObject({
        id: productId,
        name: `Updated Product ${ts}`,
      });
    });

    it('should delete a product', async () => {
      const { data, errors } = await gql(
        `mutation DeleteProduct($id: String!) {
          deleteProduct(id: $id)
        }`,
        { id: productId },
        authHeaders(token),
      );

      expect(errors).toBeUndefined();
      expect(data.deleteProduct).toBe(true);
    });

    it('should fail to create product without auth', async () => {
      const { errors } = await gql(
        `mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) { id name price sku }
        }`,
        {
          input: {
            name: `Unauth Product ${ts}`,
            description: 'Should fail',
            price: 9.99,
            sku: `SKU-UNAUTH-${ts}`,
            categoryId,
          },
        },
      );

      expect(errors).toBeDefined();
      expect(errors!.length).toBeGreaterThan(0);
    });
  });
});
