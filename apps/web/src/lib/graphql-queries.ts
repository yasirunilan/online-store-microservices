export const PRODUCTS_QUERY = `
  query products($limit: Int!, $offset: Int!, $categoryId: ID) {
    products(limit: $limit, offset: $offset, categoryId: $categoryId) {
      id
      name
      description
      price
      sku
      categoryId
      category {
        id
        name
      }
      inventory {
        quantity
        reservedQuantity
      }
    }
  }
`;

export const PRODUCT_QUERY = `
  query product($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      sku
      categoryId
      category {
        id
        name
      }
      inventory {
        quantity
        reservedQuantity
      }
    }
  }
`;

export const CATEGORIES_QUERY = `
  query categories {
    categories {
      id
      name
    }
  }
`;
