export interface SeedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Wireless Bluetooth Headphones',
    description:
      'Over-ear noise-cancelling headphones with 30-hour battery life',
    price: 79.99,
    category: 'Electronics',
  },
  {
    id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
    name: 'Mechanical Keyboard',
    description: 'Compact TKL keyboard with Cherry MX Brown switches',
    price: 129.99,
    category: 'Electronics',
  },
  {
    id: '8e1d9ffa-9d19-4c71-b3e6-5e8f4a9c2d1a',
    name: 'USB-C Hub 7-in-1',
    description:
      '7-port hub with HDMI, SD card reader, and 100W PD pass-through',
    price: 49.99,
    category: 'Electronics',
  },
  {
    id: '3f4e5a6b-7c8d-9e0f-a1b2-c3d4e5f60718',
    name: 'Ergonomic Office Chair',
    description:
      'Lumbar-support mesh chair with adjustable armrests and headrest',
    price: 299.99,
    category: 'Furniture',
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Standing Desk Converter',
    description:
      '32-inch height-adjustable monitor riser with spacious work surface',
    price: 189.99,
    category: 'Furniture',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Stainless Steel Water Bottle',
    description:
      'Double-wall insulated 32oz bottle, keeps drinks cold for 24 hours',
    price: 34.99,
    category: 'Kitchen',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-012345678902',
    name: 'Lightweight Running Shoes',
    description: 'Trail running shoes with responsive foam cushioning',
    price: 109.99,
    category: 'Sports',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-123456789013',
    name: 'Non-Slip Yoga Mat',
    description: '6mm thick TPE mat with alignment guides and carry strap',
    price: 44.99,
    category: 'Sports',
  },
];
