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
      circles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          contact_email: string;
          category: string;
          university: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          contact_email: string;
          category?: string;
          university?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          contact_email?: string;
          category?: string;
          university?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      circle_admins: {
        Row: {
          id: string;
          user_id: string;
          circle_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          circle_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          circle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "circle_admins_circle_id_fkey";
            columns: ["circle_id"];
            isOneToOne: false;
            referencedRelation: "circles";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          circle_id: string;
          title: string;
          description: string | null;
          date: string;
          location: string | null;
          capacity: number;
          reserved_count: number;
          status: "open" | "closed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          title: string;
          description?: string | null;
          date: string;
          location?: string | null;
          capacity?: number;
          reserved_count?: number;
          status?: "open" | "closed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          location?: string | null;
          capacity?: number;
          reserved_count?: number;
          status?: "open" | "closed" | "cancelled";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_circle_id_fkey";
            columns: ["circle_id"];
            isOneToOne: false;
            referencedRelation: "circles";
            referencedColumns: ["id"];
          }
        ];
      };
      reservations: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          email: string;
          grade: string;
          department: string;
          note: string | null;
          status: "pending" | "approved" | "rejected" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email: string;
          grade: string;
          department: string;
          note?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string;
          grade?: string;
          department?: string;
          note?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      decrement_reserved_count: {
        Args: { p_event_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Circle = Database["public"]["Tables"]["circles"]["Row"];
export type CircleInsert = Database["public"]["Tables"]["circles"]["Insert"];
export type CircleUpdate = Database["public"]["Tables"]["circles"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];
export type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"];

export type CircleAdmin = Database["public"]["Tables"]["circle_admins"]["Row"];

export type EventWithCircle = Event & { circles: Circle };
export type ReservationWithEvent = Reservation & { events: EventWithCircle };
