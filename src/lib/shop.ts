export type Category = "MAIN" | "APPETIZER" | "DRINK"; // prisma

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  rating?: number;
  time?: string;
  description?: string;
};

export type CartLine = MenuItem & { quantity: number };

export type OrderType = "DINE_IN" | "TAKE_AWAY"; // prisma DiningType
export type PaymentChoice = "CASH" | "CASHLESS"; // Midtrans for cashless

// Kategori prisma: MAIN, APPETIZER, DRINK
export const MENU_CATEGORIES: { id: Category; name: string }[] = [
  { id: "APPETIZER", name: "Appetizer" },
  { id: "MAIN", name: "Main Course" },
  { id: "DRINK", name: "Drink" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "itm-1",
    name: "Caesar Salad",
    category: "APPETIZER",
    price: 45000,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600",
    rating: 4.5,
    time: "10 min",
    description: "Fresh romaine lettuce with parmesan and croutons",
  },
  {
    id: "itm-2",
    name: "Grilled Salmon",
    category: "MAIN",
    price: 89000,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
    rating: 4.8,
    time: "25 min",
    description: "Atlantic salmon with herbs and lemon",
  },
  {
    id: "itm-3",
    name: "Margherita Pizza",
    category: "MAIN",
    price: 65000,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600",
    rating: 4.7,
    time: "20 min",
    description: "Tomato, mozzarella, basil",
  },
  {
    id: "itm-4",
    name: "Iced Coffee",
    category: "DRINK",
    price: 25000,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
    rating: 4.3,
    time: "5 min",
    description: "Cold brew coffee with milk",
  },
  {
    id: "itm-5",
    name: "Fruit Smoothie",
    category: "DRINK",
    price: 30000,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600",
    rating: 4.4,
    time: "7 min",
    description: "Mixed tropical fruits smoothie",
  },
];
