// Combo Types
export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface CreateComboRequest {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface UpdateComboRequest {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

// ComboItem Types
export interface ComboItem {
  id: string;
  comboId: string;
  name: string;
  quantity: number;
}

export interface CreateComboItemRequest {
  comboId: string;
  name: string;
  quantity: number;
}

export interface UpdateComboItemRequest {
  name: string;
  quantity: number;
}

// Combined types for form handling
export interface ComboWithItems extends Combo {
  items?: ComboItem[];
}

export interface CreateComboWithItemsRequest {
  combo: CreateComboRequest;
  items: Omit<CreateComboItemRequest, 'comboId'>[];
}
