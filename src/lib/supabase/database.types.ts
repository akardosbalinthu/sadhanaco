
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_notifications": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"payload": NonNullable<Json>,"read_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"payload"?: NonNullable<Json>,"read_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"payload"?: NonNullable<Json>,"read_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"app_settings": {
                  Row: {
                    "belso_kor_priority_hours": number,"billing_entity": NonNullable<Json>,"cohort_start_date": string | null,"consultation_carry_over": boolean,"consultation_reset_mode": string,"eur_huf_rate": number,"event_member_quota_ratio": number,"id": boolean,"invoice_provider": string,"kata_annual_limit_huf": number,"kata_warning_ratio": number,"kind_message_min_huf": number,"lesson_unlock_mode": string,"oss_limit_eur": number,"past_due_has_access": boolean,"payment_hold_minutes": number,"phone_retention_days": number,"registration_open": boolean,"superadmin_emails": (string)[],"terms_version": string,"trial_days": number,"updated_at": string,"voluntary_fees_are_service": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "belso_kor_priority_hours"?: number,"billing_entity"?: NonNullable<Json>,"cohort_start_date"?: string | null,"consultation_carry_over"?: boolean,"consultation_reset_mode"?: string,"eur_huf_rate"?: number,"event_member_quota_ratio"?: number,"id"?: boolean,"invoice_provider"?: string,"kata_annual_limit_huf"?: number,"kata_warning_ratio"?: number,"kind_message_min_huf"?: number,"lesson_unlock_mode"?: string,"oss_limit_eur"?: number,"past_due_has_access"?: boolean,"payment_hold_minutes"?: number,"phone_retention_days"?: number,"registration_open"?: boolean,"superadmin_emails"?: (string)[],"terms_version"?: string,"trial_days"?: number,"updated_at"?: string,"voluntary_fees_are_service"?: boolean
                  }
                  Update: {
                    "belso_kor_priority_hours"?: number,"billing_entity"?: NonNullable<Json>,"cohort_start_date"?: string | null,"consultation_carry_over"?: boolean,"consultation_reset_mode"?: string,"eur_huf_rate"?: number,"event_member_quota_ratio"?: number,"id"?: boolean,"invoice_provider"?: string,"kata_annual_limit_huf"?: number,"kata_warning_ratio"?: number,"kind_message_min_huf"?: number,"lesson_unlock_mode"?: string,"oss_limit_eur"?: number,"past_due_has_access"?: boolean,"payment_hold_minutes"?: number,"phone_retention_days"?: number,"registration_open"?: boolean,"superadmin_emails"?: (string)[],"terms_version"?: string,"trial_days"?: number,"updated_at"?: string,"voluntary_fees_are_service"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"edited_at": string | null,"id": string,"is_hidden": boolean,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"post_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "post_feed"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"consultations": {
                  Row: {
                    "created_at": string,"id": string,"invoice_id": string | null,"is_free": boolean,"note": string | null,"price_huf": number,"requested_for": string | null,"status": Database["public"]['Enums']["consultation_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invoice_id"?: string | null,"is_free": boolean,"note"?: string | null,"price_huf"?: number,"requested_for"?: string | null,"status"?: Database["public"]['Enums']["consultation_status"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invoice_id"?: string | null,"is_free"?: boolean,"note"?: string | null,"price_huf"?: number,"requested_for"?: string | null,"status"?: Database["public"]['Enums']["consultation_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultations_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations": {
                  Row: {
                    "cancelled_at": string | null,"created_at": string,"event_id": string,"guest_email": string | null,"guest_name": string | null,"hold_expires_at": string | null,"id": string,"is_member_seat": boolean,"price_huf": number,"status": Database["public"]['Enums']["registration_status"],"tier_at_booking": Database["public"]['Enums']["membership_tier"] | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelled_at"?: string | null,"created_at"?: string,"event_id": string,"guest_email"?: string | null,"guest_name"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_member_seat": boolean,"price_huf"?: number,"status": Database["public"]['Enums']["registration_status"],"tier_at_booking"?: Database["public"]['Enums']["membership_tier"] | null,"user_id"?: string | null
                  }
                  Update: {
                    "cancelled_at"?: string | null,"created_at"?: string,"event_id"?: string,"guest_email"?: string | null,"guest_name"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_member_seat"?: boolean,"price_huf"?: number,"status"?: Database["public"]['Enums']["registration_status"],"tier_at_booking"?: Database["public"]['Enums']["membership_tier"] | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "allowed_tiers": (Database["public"]['Enums']["membership_tier"])[],"belso_kor_priority": boolean,"cancelled_at": string | null,"capacity": number | null,"created_at": string,"description": string | null,"ends_at": string | null,"id": string,"is_online": boolean,"is_published": boolean,"kind": Database["public"]['Enums']["event_kind"],"location": string | null,"member_quota_ratio": number | null,"members_only": boolean,"price_belso_kor_huf": number,"price_external_huf": number | null,"price_tarsasagi_huf": number,"registration_closes_at": string | null,"registration_opens_at": string,"requires_retreat_unlock": boolean,"starts_at": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allowed_tiers"?: (Database["public"]['Enums']["membership_tier"])[],"belso_kor_priority"?: boolean,"cancelled_at"?: string | null,"capacity"?: number | null,"created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"is_online"?: boolean,"is_published"?: boolean,"kind": Database["public"]['Enums']["event_kind"],"location"?: string | null,"member_quota_ratio"?: number | null,"members_only"?: boolean,"price_belso_kor_huf"?: number,"price_external_huf"?: number | null,"price_tarsasagi_huf"?: number,"registration_closes_at"?: string | null,"registration_opens_at": string,"requires_retreat_unlock"?: boolean,"starts_at": string,"title": string
                  }
                  Update: {
                    "allowed_tiers"?: (Database["public"]['Enums']["membership_tier"])[],"belso_kor_priority"?: boolean,"cancelled_at"?: string | null,"capacity"?: number | null,"created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"is_online"?: boolean,"is_published"?: boolean,"kind"?: Database["public"]['Enums']["event_kind"],"location"?: string | null,"member_quota_ratio"?: number | null,"members_only"?: boolean,"price_belso_kor_huf"?: number,"price_external_huf"?: number | null,"price_tarsasagi_huf"?: number,"registration_closes_at"?: string | null,"registration_opens_at"?: string,"requires_retreat_unlock"?: boolean,"starts_at"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invoices": {
                  Row: {
                    "amount_huf": number,"billing_entity": NonNullable<Json>,"country": string,"created_at": string,"created_by": string | null,"currency": string,"description": string,"id": string,"invoice_provider": string,"is_storno": boolean,"issued_at": string,"product_code": string | null,"provider_invoice_id": string | null,"provider_invoice_number": string | null,"region": Database["public"]['Enums']["revenue_region"],"storno_of": string | null,"storno_reason": string | null,"stripe_invoice_id": string | null,"stripe_payment_intent_id": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_huf": number,"billing_entity": NonNullable<Json>,"country": string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"description": string,"id"?: string,"invoice_provider"?: string,"is_storno"?: boolean,"issued_at"?: string,"product_code"?: string | null,"provider_invoice_id"?: string | null,"provider_invoice_number"?: string | null,"region": Database["public"]['Enums']["revenue_region"],"storno_of"?: string | null,"storno_reason"?: string | null,"stripe_invoice_id"?: string | null,"stripe_payment_intent_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "amount_huf"?: number,"billing_entity"?: NonNullable<Json>,"country"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"description"?: string,"id"?: string,"invoice_provider"?: string,"is_storno"?: boolean,"issued_at"?: string,"product_code"?: string | null,"provider_invoice_id"?: string | null,"provider_invoice_number"?: string | null,"region"?: Database["public"]['Enums']["revenue_region"],"storno_of"?: string | null,"storno_reason"?: string | null,"stripe_invoice_id"?: string | null,"stripe_payment_intent_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_product_code_fkey"
      columns: ["product_code"]
isOneToOne: false
      referencedRelation: "price_catalog"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "invoices_storno_of_fkey"
      columns: ["storno_of"]
isOneToOne: true
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"kind_messages": {
                  Row: {
                    "amount_huf": number,"created_at": string,"delivered_at": string | null,"id": string,"invoice_id": string | null,"is_free": boolean,"message": string,"phone_purged_at": string | null,"recipient_name": string,"recipient_phone": string | null,"sender_id": string,"status": Database["public"]['Enums']["kind_message_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_huf"?: number,"created_at"?: string,"delivered_at"?: string | null,"id"?: string,"invoice_id"?: string | null,"is_free": boolean,"message": string,"phone_purged_at"?: string | null,"recipient_name": string,"recipient_phone"?: string | null,"sender_id": string,"status"?: Database["public"]['Enums']["kind_message_status"]
                  }
                  Update: {
                    "amount_huf"?: number,"created_at"?: string,"delivered_at"?: string | null,"id"?: string,"invoice_id"?: string | null,"is_free"?: boolean,"message"?: string,"phone_purged_at"?: string | null,"recipient_name"?: string,"recipient_phone"?: string | null,"sender_id"?: string,"status"?: Database["public"]['Enums']["kind_message_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "kind_messages_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kind_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_completions": {
                  Row: {
                    "created_at": string,"id": string,"lesson_id": string,"practiced_on": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"lesson_id": string,"practiced_on"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"lesson_id"?: string,"practiced_on"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_completions_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_completions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "bunny_video_id": string | null,"created_at": string,"description": string | null,"duration_seconds": number | null,"id": string,"is_published": boolean,"kind": Database["public"]['Enums']["lesson_kind"],"module_id": string,"sort_order": number,"title": string,"week_number": number
                  }
                  ComputedFields: never
                  Insert: {
                    "bunny_video_id"?: string | null,"created_at"?: string,"description"?: string | null,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"kind": Database["public"]['Enums']["lesson_kind"],"module_id": string,"sort_order"?: number,"title": string,"week_number": number
                  }
                  Update: {
                    "bunny_video_id"?: string | null,"created_at"?: string,"description"?: string | null,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"kind"?: Database["public"]['Enums']["lesson_kind"],"module_id"?: string,"sort_order"?: number,"title"?: string,"week_number"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "modules"
      referencedColumns: ["id"]
    }
                  ]
                },"modules": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"slug": string,"stage": number,"subtitle": string | null,"title": string,"total_weeks": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"slug": string,"stage": number,"subtitle"?: string | null,"title": string,"total_weeks"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"slug"?: string,"stage"?: number,"subtitle"?: string | null,"title"?: string,"total_weeks"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"post_reactions": {
                  Row: {
                    "created_at": string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"kind"?: Database["public"]['Enums']["reaction_kind"],"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "post_feed"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"edited_at": string | null,"id": string,"is_hidden": boolean,"kind": Database["public"]['Enums']["post_kind"],"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"title"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_hidden"?: boolean,"kind"?: Database["public"]['Enums']["post_kind"],"title"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"price_catalog": {
                  Row: {
                    "amount_huf": number,"billing_interval": Database["public"]['Enums']["billing_interval"] | null,"code": string,"is_active": boolean,"label": string,"stripe_product_id": string | null,"tier": Database["public"]['Enums']["membership_tier"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_huf": number,"billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"code": string,"is_active"?: boolean,"label": string,"stripe_product_id"?: string | null,"tier"?: Database["public"]['Enums']["membership_tier"] | null,"updated_at"?: string
                  }
                  Update: {
                    "amount_huf"?: number,"billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"code"?: string,"is_active"?: boolean,"label"?: string,"stripe_product_id"?: string | null,"tier"?: Database["public"]['Enums']["membership_tier"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "billing_interval": Database["public"]['Enums']["billing_interval"] | null,"bio": string | null,"cancel_at_period_end": boolean,"cohort_start_date": string | null,"consultations_period_start": string | null,"country": string | null,"created_at": string,"current_period_end": string | null,"current_stage_label": string | null,"display_name": string,"email": string,"free_consultations_remaining": number,"free_messages_remaining": number,"id": string,"ip3_purchased": boolean,"ip3_unlocked": boolean,"ip3_unlocked_at": string | null,"m2_purchased": boolean,"m2_unlocked": boolean,"m2_unlocked_at": string | null,"membership_ended_at": string | null,"membership_started_at": string | null,"privat_kozlony_pro": boolean,"recurring_amount_huf": number | null,"retreat_unlocked": boolean,"role": Database["public"]['Enums']["user_role"],"stripe_customer_id": string | null,"stripe_subscription_id": string | null,"subscription_status": Database["public"]['Enums']["subscription_status"],"tier": Database["public"]['Enums']["membership_tier"],"trial_ends_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"bio"?: string | null,"cancel_at_period_end"?: boolean,"cohort_start_date"?: string | null,"consultations_period_start"?: string | null,"country"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_stage_label"?: string | null,"display_name"?: string,"email": string,"free_consultations_remaining"?: number,"free_messages_remaining"?: number,"id": string,"ip3_purchased"?: boolean,"ip3_unlocked"?: boolean,"ip3_unlocked_at"?: string | null,"m2_purchased"?: boolean,"m2_unlocked"?: boolean,"m2_unlocked_at"?: string | null,"membership_ended_at"?: string | null,"membership_started_at"?: string | null,"privat_kozlony_pro"?: boolean,"recurring_amount_huf"?: number | null,"retreat_unlocked"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"tier"?: Database["public"]['Enums']["membership_tier"],"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"bio"?: string | null,"cancel_at_period_end"?: boolean,"cohort_start_date"?: string | null,"consultations_period_start"?: string | null,"country"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_stage_label"?: string | null,"display_name"?: string,"email"?: string,"free_consultations_remaining"?: number,"free_messages_remaining"?: number,"id"?: string,"ip3_purchased"?: boolean,"ip3_unlocked"?: boolean,"ip3_unlocked_at"?: string | null,"m2_purchased"?: boolean,"m2_unlocked"?: boolean,"m2_unlocked_at"?: string | null,"membership_ended_at"?: string | null,"membership_started_at"?: string | null,"privat_kozlony_pro"?: boolean,"recurring_amount_huf"?: number | null,"retreat_unlocked"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"tier"?: Database["public"]['Enums']["membership_tier"],"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"purchase_consents": {
                  Row: {
                    "consent_kind": string,"consented_at": string,"email": string,"id": string,"ip_address": unknown,"product_code": string | null,"stripe_checkout_session_id": string | null,"terms_version": string,"user_agent": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "consent_kind"?: string,"consented_at"?: string,"email": string,"id"?: string,"ip_address"?: unknown,"product_code"?: string | null,"stripe_checkout_session_id"?: string | null,"terms_version": string,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "consent_kind"?: string,"consented_at"?: string,"email"?: string,"id"?: string,"ip_address"?: unknown,"product_code"?: string | null,"stripe_checkout_session_id"?: string | null,"terms_version"?: string,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchase_consents_product_code_fkey"
      columns: ["product_code"]
isOneToOne: false
      referencedRelation: "price_catalog"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "purchase_consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"stripe_events": {
                  Row: {
                    "error": string | null,"id": string,"payload": NonNullable<Json>,"processed_at": string | null,"received_at": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"id": string,"payload": NonNullable<Json>,"processed_at"?: string | null,"received_at"?: string,"type": string
                  }
                  Update: {
                    "error"?: string | null,"id"?: string,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"received_at"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"trial_usage": {
                  Row: {
                    "card_fingerprint": string | null,"email_normalized": string,"id": string,"stripe_subscription_id": string | null,"used_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "card_fingerprint"?: string | null,"email_normalized": string,"id"?: string,"stripe_subscription_id"?: string | null,"used_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "card_fingerprint"?: string | null,"email_normalized"?: string,"id"?: string,"stripe_subscription_id"?: string | null,"used_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "trial_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "post_feed": {
                  Row: {
                    "author_id": string | null,"body": string,"comment_count": number | null,"created_at": string,"edited_at": string | null,"hasonlot_count": number | null,"id": string,"is_unanswered": boolean | null,"kind": Database["public"]['Enums']["post_kind"],"koszonom_count": number | null,"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "author_id"?: string | null,"body"?: string | null,"comment_count"?: never,"created_at"?: string | null,"edited_at"?: string | null,"hasonlot_count"?: never,"id"?: string | null,"is_unanswered"?: never,"kind"?: Database["public"]['Enums']["post_kind"] | null,"koszonom_count"?: never,"title"?: string | null
                         }
                        Update: {
                           "author_id"?: string | null,"body"?: string | null,"comment_count"?: never,"created_at"?: string | null,"edited_at"?: string | null,"hasonlot_count"?: never,"id"?: string | null,"is_unanswered"?: never,"kind"?: Database["public"]['Enums']["post_kind"] | null,"koszonom_count"?: never,"title"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_record_storno":
{ Args: { "p_invoice_id": string,"p_provider_invoice_number": string,"p_reason": string }; Returns: {
              "amount_huf": number,
"billing_entity": NonNullable<Json>,
"country": string,
"created_at": string,
"created_by": string | null,
"currency": string,
"description": string,
"id": string,
"invoice_provider": string,
"is_storno": boolean,
"issued_at": string,
"product_code": string | null,
"provider_invoice_id": string | null,
"provider_invoice_number": string | null,
"region": Database["public"]['Enums']["revenue_region"],
"storno_of": string | null,
"storno_reason": string | null,
"stripe_invoice_id": string | null,
"stripe_payment_intent_id": string | null,
"user_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "invoices"
        isOneToOne: true
        isSetofReturn: false
      } },
"book_event":
{ Args: { "p_event_id": string }; Returns: {
              "cancelled_at": string | null,
"created_at": string,
"event_id": string,
"guest_email": string | null,
"guest_name": string | null,
"hold_expires_at": string | null,
"id": string,
"is_member_seat": boolean,
"price_huf": number,
"status": Database["public"]['Enums']["registration_status"],
"tier_at_booking": Database["public"]['Enums']["membership_tier"] | null,
"user_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "event_registrations"
        isOneToOne: true
        isSetofReturn: false
      } },
"book_free_consultation":
{ Args: { "p_note"?: string,"p_requested_for"?: string }; Returns: {
              "created_at": string,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"note": string | null,
"price_huf": number,
"requested_for": string | null,
"status": Database["public"]['Enums']["consultation_status"],
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "consultations"
        isOneToOne: true
        isSetofReturn: false
      } },
"budapest_today":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"can_access_lesson":
{ Args: { "p_module_id": string,"p_week": number }; Returns: boolean
                           },
"can_access_stage":
{ Args: { "p_stage": number }; Returns: boolean
                           },
"community_authors":
{ Args: { "p_ids": (string)[] }; Returns: {
              "current_stage_label": string,"display_name": string,"id": string,"is_current_member": boolean
            }[]
                           },
"confirm_registration_payment":
{ Args: { "p_registration_id": string }; Returns: {
              "cancelled_at": string | null,
"created_at": string,
"event_id": string,
"guest_email": string | null,
"guest_name": string | null,
"hold_expires_at": string | null,
"id": string,
"is_member_seat": boolean,
"price_huf": number,
"status": Database["public"]['Enums']["registration_status"],
"tier_at_booking": Database["public"]['Enums']["membership_tier"] | null,
"user_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "event_registrations"
        isOneToOne: true
        isSetofReturn: false
      } },
"current_week":
{ Args: { "p_stage": number }; Returns: number
                           },
"has_member_access":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_paying_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_superadmin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"kata_revenue_status":
{ Args: { "p_year"?: number }; Returns: Json
                           },
"public_open_evenings":
{ Args: Record<PropertyKey, never>; Returns: {
              "description": string,"ends_at": string,"id": string,"is_online": boolean,"location": string,"price_external_huf": number,"registration_open": boolean,"seats_left": number,"starts_at": string,"title": string
            }[]
                           },
"purge_kind_message_phones":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"reserve_guest_seat":
{ Args: { "p_event_id": string,"p_guest_email": string,"p_guest_name": string }; Returns: {
              "cancelled_at": string | null,
"created_at": string,
"event_id": string,
"guest_email": string | null,
"guest_name": string | null,
"hold_expires_at": string | null,
"id": string,
"is_member_seat": boolean,
"price_huf": number,
"status": Database["public"]['Enums']["registration_status"],
"tier_at_booking": Database["public"]['Enums']["membership_tier"] | null,
"user_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "event_registrations"
        isOneToOne: true
        isSetofReturn: false
      } },
"revenue_region_for":
{ Args: { "p_country": string }; Returns: Database["public"]['Enums']["revenue_region"]
                           },
"send_free_kind_message":
{ Args: { "p_message": string,"p_recipient_name": string,"p_recipient_phone": string }; Returns: {
              "amount_huf": number,
"created_at": string,
"delivered_at": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "billing_interval": "month"|"year","consultation_status": "requested"|"scheduled"|"done"|"cancelled","event_kind": "nyilt_est"|"gyakorlonap"|"elvonulas"|"online_meditacio"|"qa_elo","kind_message_status": "queued"|"scheduled"|"delivered"|"rejected","lesson_kind": "video"|"audio"|"text","membership_tier": "none"|"tarsasagi"|"belso_kor","post_kind": "normal"|"penteki_kor","reaction_kind": "koszonom"|"hasonlot","registration_status": "pending_payment"|"confirmed"|"cancelled","revenue_region": "HU"|"EU"|"NON_EU","subscription_status": "none"|"trialing"|"active"|"past_due"|"canceled"|"unpaid"|"incomplete"|"incomplete_expired"|"paused","user_role": "member"|"admin"|"superadmin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "billing_interval": ["month", "year"],"consultation_status": ["requested", "scheduled", "done", "cancelled"],"event_kind": ["nyilt_est", "gyakorlonap", "elvonulas", "online_meditacio", "qa_elo"],"kind_message_status": ["queued", "scheduled", "delivered", "rejected"],"lesson_kind": ["video", "audio", "text"],"membership_tier": ["none", "tarsasagi", "belso_kor"],"post_kind": ["normal", "penteki_kor"],"reaction_kind": ["koszonom", "hasonlot"],"registration_status": ["pending_payment", "confirmed", "cancelled"],"revenue_region": ["HU", "EU", "NON_EU"],"subscription_status": ["none", "trialing", "active", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"],"user_role": ["member", "admin", "superadmin"]
          }
        }
} as const
