export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      about_settings: {
        Row: {
          created_at: string
          description_text: string
          id: string
          intro_text: string
          main_title: string
          profile_photo_url: string | null
          quote_author: string
          quote_text: string
          services: Json
          skills: Json
          stats: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_text?: string
          id?: string
          intro_text?: string
          main_title?: string
          profile_photo_url?: string | null
          quote_author?: string
          quote_text?: string
          services?: Json
          skills?: Json
          stats?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_text?: string
          id?: string
          intro_text?: string
          main_title?: string
          profile_photo_url?: string | null
          quote_author?: string
          quote_text?: string
          services?: Json
          skills?: Json
          stats?: Json
          updated_at?: string
        }
        Relationships: []
      }
      albums: {
        Row: {
          cover_photo_id: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean | null
          name: string
          show_description_in_slideshow: boolean | null
          show_title_in_slideshow: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          name: string
          show_description_in_slideshow?: boolean | null
          show_title_in_slideshow?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          name?: string
          show_description_in_slideshow?: boolean | null
          show_title_in_slideshow?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_albums_cover_photo"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          auto_reply_enabled: boolean
          auto_reply_message: string
          auto_reply_subject: string
          contact_address: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          form_enabled: boolean
          id: string
          notification_email: string | null
          updated_at: string
        }
        Insert: {
          auto_reply_enabled?: boolean
          auto_reply_message?: string
          auto_reply_subject?: string
          contact_address?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          form_enabled?: boolean
          id?: string
          notification_email?: string | null
          updated_at?: string
        }
        Update: {
          auto_reply_enabled?: boolean
          auto_reply_message?: string
          auto_reply_subject?: string
          contact_address?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          form_enabled?: boolean
          id?: string
          notification_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      footer_elements: {
        Row: {
          content: string | null
          created_at: string
          element_id: string
          element_type: string
          id: string
          parent_element_id: string | null
          position_x: number
          position_y: number
          responsive_styles: Json | null
          size_height: number
          size_width: number
          sort_order: number | null
          styles: Json | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          element_id: string
          element_type: string
          id?: string
          parent_element_id?: string | null
          position_x?: number
          position_y?: number
          responsive_styles?: Json | null
          size_height?: number
          size_width?: number
          sort_order?: number | null
          styles?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          element_id?: string
          element_type?: string
          id?: string
          parent_element_id?: string | null
          position_x?: number
          position_y?: number
          responsive_styles?: Json | null
          size_height?: number
          size_width?: number
          sort_order?: number | null
          styles?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_default: boolean
          is_enabled: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_builder_elements: {
        Row: {
          content: string | null
          created_at: string
          element_id: string
          element_type: string
          id: string
          page_id: string
          parent_element_id: string | null
          position_x: number
          position_y: number
          responsive_styles: Json | null
          size_height: number
          size_width: number
          sort_order: number | null
          styles: Json | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          element_id: string
          element_type: string
          id?: string
          page_id: string
          parent_element_id?: string | null
          position_x?: number
          position_y?: number
          responsive_styles?: Json | null
          size_height?: number
          size_width?: number
          sort_order?: number | null
          styles?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          element_id?: string
          element_type?: string
          id?: string
          page_id?: string
          parent_element_id?: string | null
          position_x?: number
          position_y?: number
          responsive_styles?: Json | null
          size_height?: number
          size_width?: number
          sort_order?: number | null
          styles?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_builder_elements_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_builder_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_builder_pages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_homepage: boolean | null
          is_published: boolean | null
          is_template: boolean | null
          menu_order: number | null
          name: string
          parent_page_id: string | null
          slug: string
          template_category: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          is_template?: boolean | null
          menu_order?: number | null
          name: string
          parent_page_id?: string | null
          slug: string
          template_category?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_homepage?: boolean | null
          is_published?: boolean | null
          is_template?: boolean | null
          menu_order?: number | null
          name?: string
          parent_page_id?: string | null
          slug?: string
          template_category?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_builder_pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "page_builder_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          album_id: string | null
          alt_text: string | null
          caption: string | null
          created_at: string
          file_url: string
          filename: string
          id: string
          is_visible: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_url: string
          filename: string
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_url?: string
          filename?: string
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          content_font_family: string | null
          content_font_url: string | null
          created_at: string
          custom_font_family: string | null
          custom_font_url: string | null
          default_language: string | null
          footer_background_color: string | null
          footer_blur: boolean | null
          footer_color: string | null
          footer_enabled: boolean | null
          footer_font_family: string | null
          footer_font_size: number | null
          footer_height: number | null
          footer_hover_opacity: number | null
          footer_opacity: number | null
          footer_overlay: boolean | null
          footer_text: string | null
          footer_text_align: string | null
          header_background_opacity: number | null
          header_blur: boolean | null
          header_transparent: boolean | null
          home_show_buttons: boolean | null
          home_show_title_overlay: boolean | null
          id: string
          logo_height: number | null
          logo_margin_left: number | null
          logo_margin_top: number | null
          logo_position: string | null
          logo_shadow: boolean | null
          logo_url: string | null
          openai_api_key: string | null
          portfolio_description: string | null
          portfolio_enabled: boolean | null
          portfolio_title: string | null
          primary_color: string | null
          secondary_color: string | null
          show_site_title: boolean | null
          site_tagline: string | null
          site_title: string
          slideshow_info_card_enabled: boolean | null
          slideshow_info_card_opacity: number | null
          slideshow_info_card_position: string | null
          slideshow_info_card_radius: number | null
          slideshow_info_card_text_size: number | null
          slideshow_interval: number | null
          slideshow_show_arrows: boolean | null
          slideshow_show_dots: boolean | null
          slideshow_transition: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          title_font_family: string | null
          title_font_url: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          content_font_family?: string | null
          content_font_url?: string | null
          created_at?: string
          custom_font_family?: string | null
          custom_font_url?: string | null
          default_language?: string | null
          footer_background_color?: string | null
          footer_blur?: boolean | null
          footer_color?: string | null
          footer_enabled?: boolean | null
          footer_font_family?: string | null
          footer_font_size?: number | null
          footer_height?: number | null
          footer_hover_opacity?: number | null
          footer_opacity?: number | null
          footer_overlay?: boolean | null
          footer_text?: string | null
          footer_text_align?: string | null
          header_background_opacity?: number | null
          header_blur?: boolean | null
          header_transparent?: boolean | null
          home_show_buttons?: boolean | null
          home_show_title_overlay?: boolean | null
          id?: string
          logo_height?: number | null
          logo_margin_left?: number | null
          logo_margin_top?: number | null
          logo_position?: string | null
          logo_shadow?: boolean | null
          logo_url?: string | null
          openai_api_key?: string | null
          portfolio_description?: string | null
          portfolio_enabled?: boolean | null
          portfolio_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_site_title?: boolean | null
          site_tagline?: string | null
          site_title?: string
          slideshow_info_card_enabled?: boolean | null
          slideshow_info_card_opacity?: number | null
          slideshow_info_card_position?: string | null
          slideshow_info_card_radius?: number | null
          slideshow_info_card_text_size?: number | null
          slideshow_interval?: number | null
          slideshow_show_arrows?: boolean | null
          slideshow_show_dots?: boolean | null
          slideshow_transition?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          title_font_family?: string | null
          title_font_url?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          content_font_family?: string | null
          content_font_url?: string | null
          created_at?: string
          custom_font_family?: string | null
          custom_font_url?: string | null
          default_language?: string | null
          footer_background_color?: string | null
          footer_blur?: boolean | null
          footer_color?: string | null
          footer_enabled?: boolean | null
          footer_font_family?: string | null
          footer_font_size?: number | null
          footer_height?: number | null
          footer_hover_opacity?: number | null
          footer_opacity?: number | null
          footer_overlay?: boolean | null
          footer_text?: string | null
          footer_text_align?: string | null
          header_background_opacity?: number | null
          header_blur?: boolean | null
          header_transparent?: boolean | null
          home_show_buttons?: boolean | null
          home_show_title_overlay?: boolean | null
          id?: string
          logo_height?: number | null
          logo_margin_left?: number | null
          logo_margin_top?: number | null
          logo_position?: string | null
          logo_shadow?: boolean | null
          logo_url?: string | null
          openai_api_key?: string | null
          portfolio_description?: string | null
          portfolio_enabled?: boolean | null
          portfolio_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_site_title?: boolean | null
          site_tagline?: string | null
          site_title?: string
          slideshow_info_card_enabled?: boolean | null
          slideshow_info_card_opacity?: number | null
          slideshow_info_card_position?: string | null
          slideshow_info_card_radius?: number | null
          slideshow_info_card_text_size?: number | null
          slideshow_interval?: number | null
          slideshow_show_arrows?: boolean | null
          slideshow_show_dots?: boolean | null
          slideshow_transition?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          title_font_family?: string | null
          title_font_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      slideshow: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          field_name: string | null
          id: string
          language_code: string
          record_id: string | null
          table_name: string | null
          translation_key: string
          translation_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_name?: string | null
          id?: string
          language_code: string
          record_id?: string | null
          table_name?: string | null
          translation_key: string
          translation_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_name?: string | null
          id?: string
          language_code?: string
          record_id?: string | null
          table_name?: string | null
          translation_key?: string
          translation_value?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_authenticated_user: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "editor"],
    },
  },
} as const
