import type {
  EscrowStatus,
  Order,
  OrderInsert,
  OrderUpdate,
  Product,
  ProductInsert,
  ProductStatus,
  ProductUpdate,
  User,
  UserInsert,
  UserRole,
  UserUpdate,
  VerificationStatus,
} from "./index";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      place_catalog_order: {
        Args: {
          p_product_id: string;
          p_buyer_id: string;
          p_quantity: number;
        };
        Returns: Order;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      product_status: ProductStatus;
      escrow_status: EscrowStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
