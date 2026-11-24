
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
                    "belso_kor_priority_hours": number,"belso_kor_yearly_consultations": number,"billing_entity": NonNullable<Json>,"event_member_quota_ratio": number,"free_messages_per_tier": NonNullable<Json>,"hike_guest_invites_per_member": number,"id": boolean,"invoice_provider": string,"kind_message_confirm_hours": number,"kind_message_max_attempts": number,"kind_message_min_huf": number,"last_friday_checkin_on": string | null,"last_monthly_reset_on": string | null,"oss_warning_huf": number,"participation_weights": NonNullable<Json>,"past_due_grace_days": number,"payment_hold_minutes": number,"phone_retention_days": number,"progression_points_required": NonNullable<Json>,"registration_open": boolean,"revenue_warning_ratio": number,"stage_completion_min_ratio": number,"superadmin_emails": (string)[],"terms_version": string,"trial_days": number,"updated_at": string,"xp_daily_cap": number,"xp_ranks": NonNullable<Json>,"xp_rules": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "belso_kor_priority_hours"?: number,"belso_kor_yearly_consultations"?: number,"billing_entity"?: NonNullable<Json>,"event_member_quota_ratio"?: number,"free_messages_per_tier"?: NonNullable<Json>,"hike_guest_invites_per_member"?: number,"id"?: boolean,"invoice_provider"?: string,"kind_message_confirm_hours"?: number,"kind_message_max_attempts"?: number,"kind_message_min_huf"?: number,"last_friday_checkin_on"?: string | null,"last_monthly_reset_on"?: string | null,"oss_warning_huf"?: number,"participation_weights"?: NonNullable<Json>,"past_due_grace_days"?: number,"payment_hold_minutes"?: number,"phone_retention_days"?: number,"progression_points_required"?: NonNullable<Json>,"registration_open"?: boolean,"revenue_warning_ratio"?: number,"stage_completion_min_ratio"?: number,"superadmin_emails"?: (string)[],"terms_version"?: string,"trial_days"?: number,"updated_at"?: string,"xp_daily_cap"?: number,"xp_ranks"?: NonNullable<Json>,"xp_rules"?: NonNullable<Json>
                  }
                  Update: {
                    "belso_kor_priority_hours"?: number,"belso_kor_yearly_consultations"?: number,"billing_entity"?: NonNullable<Json>,"event_member_quota_ratio"?: number,"free_messages_per_tier"?: NonNullable<Json>,"hike_guest_invites_per_member"?: number,"id"?: boolean,"invoice_provider"?: string,"kind_message_confirm_hours"?: number,"kind_message_max_attempts"?: number,"kind_message_min_huf"?: number,"last_friday_checkin_on"?: string | null,"last_monthly_reset_on"?: string | null,"oss_warning_huf"?: number,"participation_weights"?: NonNullable<Json>,"past_due_grace_days"?: number,"payment_hold_minutes"?: number,"phone_retention_days"?: number,"progression_points_required"?: NonNullable<Json>,"registration_open"?: boolean,"revenue_warning_ratio"?: number,"stage_completion_min_ratio"?: number,"superadmin_emails"?: (string)[],"terms_version"?: string,"trial_days"?: number,"updated_at"?: string,"xp_daily_cap"?: number,"xp_ranks"?: NonNullable<Json>,"xp_rules"?: NonNullable<Json>
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
                },"compass_questions": {
                  Row: {
                    "id": number,"options": NonNullable<Json>,"position": number,"prompt": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id": number,"options": NonNullable<Json>,"position": number,"prompt": string,"weight"?: number
                  }
                  Update: {
                    "id"?: number,"options"?: NonNullable<Json>,"position"?: number,"prompt"?: string,"weight"?: number
                  }
                  Relationships: [
                    
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
                },"destination_options": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"poll_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"poll_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"poll_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "destination_options_poll_id_fkey"
      columns: ["poll_id"]
isOneToOne: false
      referencedRelation: "destination_polls"
      referencedColumns: ["id"]
    }
                  ]
                },"destination_polls": {
                  Row: {
                    "closes_at": string,"created_at": string,"description": string | null,"event_id": string | null,"id": string,"month": string,"opens_at": string,"title": string,"winning_option_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at": string,"created_at"?: string,"description"?: string | null,"event_id"?: string | null,"id"?: string,"month": string,"opens_at"?: string,"title": string,"winning_option_id"?: string | null
                  }
                  Update: {
                    "closes_at"?: string,"created_at"?: string,"description"?: string | null,"event_id"?: string | null,"id"?: string,"month"?: string,"opens_at"?: string,"title"?: string,"winning_option_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "destination_polls_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "destination_polls_winning_option_fkey"
      columns: ["winning_option_id"]
isOneToOne: false
      referencedRelation: "destination_options"
      referencedColumns: ["id"]
    }
                  ]
                },"destination_votes": {
                  Row: {
                    "created_at": string,"option_id": string,"poll_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"option_id": string,"poll_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"option_id"?: string,"poll_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "destination_votes_option_id_poll_id_fkey"
      columns: ["option_id","poll_id"]
isOneToOne: false
      referencedRelation: "destination_options"
      referencedColumns: ["id","poll_id"]
    },{
      foreignKeyName: "destination_votes_poll_id_fkey"
      columns: ["poll_id"]
isOneToOne: false
      referencedRelation: "destination_polls"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "destination_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"event_id": string,"guest_email": string,"guest_name": string,"id": string,"invited_by": string | null,"registration_id": string | null,"status": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"event_id": string,"guest_email": string,"guest_name": string,"id"?: string,"invited_by"?: string | null,"registration_id"?: string | null,"status"?: string,"token"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"event_id"?: string,"guest_email"?: string,"guest_name"?: string,"id"?: string,"invited_by"?: string | null,"registration_id"?: string | null,"status"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_invitations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_invitations_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "event_registrations"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations": {
                  Row: {
                    "attended_at": string | null,"cancelled_at": string | null,"created_at": string,"event_id": string,"guest_email": string | null,"guest_name": string | null,"hold_expires_at": string | null,"id": string,"is_member_seat": boolean,"price_huf": number,"status": Database["public"]['Enums']["registration_status"],"tier_at_booking": Database["public"]['Enums']["membership_tier"] | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attended_at"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"event_id": string,"guest_email"?: string | null,"guest_name"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_member_seat": boolean,"price_huf"?: number,"status": Database["public"]['Enums']["registration_status"],"tier_at_booking"?: Database["public"]['Enums']["membership_tier"] | null,"user_id"?: string | null
                  }
                  Update: {
                    "attended_at"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"event_id"?: string,"guest_email"?: string | null,"guest_name"?: string | null,"hold_expires_at"?: string | null,"id"?: string,"is_member_seat"?: boolean,"price_huf"?: number,"status"?: Database["public"]['Enums']["registration_status"],"tier_at_booking"?: Database["public"]['Enums']["membership_tier"] | null,"user_id"?: string | null
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
                    "amount_huf": number,"billing_entity": NonNullable<Json>,"country": string,"created_at": string,"currency": string,"description": string,"id": string,"invoice_provider": string,"issued_at": string,"product_code": string | null,"provider_invoice_id": string | null,"provider_invoice_number": string | null,"region": Database["public"]['Enums']["revenue_region"],"stripe_invoice_id": string | null,"stripe_payment_intent_id": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_huf": number,"billing_entity": NonNullable<Json>,"country": string,"created_at"?: string,"currency"?: string,"description": string,"id"?: string,"invoice_provider"?: string,"issued_at"?: string,"product_code"?: string | null,"provider_invoice_id"?: string | null,"provider_invoice_number"?: string | null,"region": Database["public"]['Enums']["revenue_region"],"stripe_invoice_id"?: string | null,"stripe_payment_intent_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "amount_huf"?: number,"billing_entity"?: NonNullable<Json>,"country"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"id"?: string,"invoice_provider"?: string,"issued_at"?: string,"product_code"?: string | null,"provider_invoice_id"?: string | null,"provider_invoice_number"?: string | null,"region"?: Database["public"]['Enums']["revenue_region"],"stripe_invoice_id"?: string | null,"stripe_payment_intent_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_product_code_fkey"
      columns: ["product_code"]
isOneToOne: false
      referencedRelation: "price_catalog"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "invoices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"journal_entries": {
                  Row: {
                    "body": string,"created_at": string,"entry_on": string,"id": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"entry_on"?: string,"id"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"entry_on"?: string,"id"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entries_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"kind_message_attempts": {
                  Row: {
                    "attempted_at": string,"attempted_by": string | null,"id": string,"message_id": string,"note": string | null,"success": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "attempted_at"?: string,"attempted_by"?: string | null,"id"?: string,"message_id": string,"note"?: string | null,"success": boolean
                  }
                  Update: {
                    "attempted_at"?: string,"attempted_by"?: string | null,"id"?: string,"message_id"?: string,"note"?: string | null,"success"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "kind_message_attempts_attempted_by_fkey"
      columns: ["attempted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kind_message_attempts_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "kind_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"kind_messages": {
                  Row: {
                    "amount_huf": number,"attempts": number,"closed_at": string | null,"confirm_expires_at": string | null,"confirm_token_hash": string | null,"confirmed_at": string | null,"created_at": string,"delivered_at": string | null,"guest_email": string | null,"guest_name": string | null,"id": string,"invoice_id": string | null,"is_free": boolean,"kind": Database["public"]['Enums']["kind_message_kind"],"last_attempt_at": string | null,"message": string,"phone_purged_at": string | null,"recipient_name": string,"recipient_phone": string | null,"sender_id": string | null,"status": Database["public"]['Enums']["kind_message_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_huf"?: number,"attempts"?: number,"closed_at"?: string | null,"confirm_expires_at"?: string | null,"confirm_token_hash"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"delivered_at"?: string | null,"guest_email"?: string | null,"guest_name"?: string | null,"id"?: string,"invoice_id"?: string | null,"is_free": boolean,"kind"?: Database["public"]['Enums']["kind_message_kind"],"last_attempt_at"?: string | null,"message": string,"phone_purged_at"?: string | null,"recipient_name": string,"recipient_phone"?: string | null,"sender_id"?: string | null,"status"?: Database["public"]['Enums']["kind_message_status"]
                  }
                  Update: {
                    "amount_huf"?: number,"attempts"?: number,"closed_at"?: string | null,"confirm_expires_at"?: string | null,"confirm_token_hash"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"delivered_at"?: string | null,"guest_email"?: string | null,"guest_name"?: string | null,"id"?: string,"invoice_id"?: string | null,"is_free"?: boolean,"kind"?: Database["public"]['Enums']["kind_message_kind"],"last_attempt_at"?: string | null,"message"?: string,"phone_purged_at"?: string | null,"recipient_name"?: string,"recipient_phone"?: string | null,"sender_id"?: string | null,"status"?: Database["public"]['Enums']["kind_message_status"]
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
                    "bunny_video_id": string | null,"created_at": string,"description": string | null,"duration_seconds": number | null,"id": string,"is_published": boolean,"kind": Database["public"]['Enums']["lesson_kind"],"module_id": string,"sort_order": number,"title": string,"track": string,"week_number": number
                  }
                  ComputedFields: never
                  Insert: {
                    "bunny_video_id"?: string | null,"created_at"?: string,"description"?: string | null,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"kind": Database["public"]['Enums']["lesson_kind"],"module_id": string,"sort_order"?: number,"title": string,"track"?: string,"week_number": number
                  }
                  Update: {
                    "bunny_video_id"?: string | null,"created_at"?: string,"description"?: string | null,"duration_seconds"?: number | null,"id"?: string,"is_published"?: boolean,"kind"?: Database["public"]['Enums']["lesson_kind"],"module_id"?: string,"sort_order"?: number,"title"?: string,"track"?: string,"week_number"?: number
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
                    "billing_interval": Database["public"]['Enums']["billing_interval"] | null,"bio": string | null,"cancel_at_period_end": boolean,"compass_answers": Json | null,"compass_completed_at": string | null,"compass_scores": Json | null,"consultations_period_start": string | null,"country": string | null,"created_at": string,"current_period_end": string | null,"current_stage_label": string | null,"display_name": string,"email": string,"first_name": string | null,"free_consultations_remaining": number,"free_messages_remaining": number,"id": string,"ip3_purchased": boolean,"ip3_unlocked": boolean,"ip3_unlocked_at": string | null,"last_name": string | null,"leaderboard_hidden": boolean,"m2_purchased": boolean,"m2_unlocked": boolean,"m2_unlocked_at": string | null,"membership_ended_at": string | null,"membership_started_at": string | null,"nickname": string | null,"order_key": Database["public"]['Enums']["order_key"] | null,"past_due_since": string | null,"privat_kozlony_pro": boolean,"recurring_amount_huf": number | null,"retreat_unlocked": boolean,"role": Database["public"]['Enums']["user_role"],"stripe_customer_id": string | null,"stripe_subscription_id": string | null,"subscription_status": Database["public"]['Enums']["subscription_status"],"tier": Database["public"]['Enums']["membership_tier"],"trial_ends_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"bio"?: string | null,"cancel_at_period_end"?: boolean,"compass_answers"?: Json | null,"compass_completed_at"?: string | null,"compass_scores"?: Json | null,"consultations_period_start"?: string | null,"country"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_stage_label"?: string | null,"display_name"?: string,"email": string,"first_name"?: string | null,"free_consultations_remaining"?: number,"free_messages_remaining"?: number,"id": string,"ip3_purchased"?: boolean,"ip3_unlocked"?: boolean,"ip3_unlocked_at"?: string | null,"last_name"?: string | null,"leaderboard_hidden"?: boolean,"m2_purchased"?: boolean,"m2_unlocked"?: boolean,"m2_unlocked_at"?: string | null,"membership_ended_at"?: string | null,"membership_started_at"?: string | null,"nickname"?: string | null,"order_key"?: Database["public"]['Enums']["order_key"] | null,"past_due_since"?: string | null,"privat_kozlony_pro"?: boolean,"recurring_amount_huf"?: number | null,"retreat_unlocked"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"tier"?: Database["public"]['Enums']["membership_tier"],"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"] | null,"bio"?: string | null,"cancel_at_period_end"?: boolean,"compass_answers"?: Json | null,"compass_completed_at"?: string | null,"compass_scores"?: Json | null,"consultations_period_start"?: string | null,"country"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_stage_label"?: string | null,"display_name"?: string,"email"?: string,"first_name"?: string | null,"free_consultations_remaining"?: number,"free_messages_remaining"?: number,"id"?: string,"ip3_purchased"?: boolean,"ip3_unlocked"?: boolean,"ip3_unlocked_at"?: string | null,"last_name"?: string | null,"leaderboard_hidden"?: boolean,"m2_purchased"?: boolean,"m2_unlocked"?: boolean,"m2_unlocked_at"?: string | null,"membership_ended_at"?: string | null,"membership_started_at"?: string | null,"nickname"?: string | null,"order_key"?: Database["public"]['Enums']["order_key"] | null,"past_due_since"?: string | null,"privat_kozlony_pro"?: boolean,"recurring_amount_huf"?: number | null,"retreat_unlocked"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"subscription_status"?: Database["public"]['Enums']["subscription_status"],"tier"?: Database["public"]['Enums']["membership_tier"],"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"progression_requests": {
                  Row: {
                    "admin_note": string | null,"consultation_at": string | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"id": string,"note": string | null,"status": Database["public"]['Enums']["progression_status"],"target_stage": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"consultation_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"note"?: string | null,"status"?: Database["public"]['Enums']["progression_status"],"target_stage": number,"user_id": string
                  }
                  Update: {
                    "admin_note"?: string | null,"consultation_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"note"?: string | null,"status"?: Database["public"]['Enums']["progression_status"],"target_stage"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "progression_requests_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progression_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"revenue_limits": {
                  Row: {
                    "kata_limit_huf": number,"note": string | null,"vat_exemption_limit_huf": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "kata_limit_huf": number,"note"?: string | null,"vat_exemption_limit_huf": number,"year": number
                  }
                  Update: {
                    "kata_limit_huf"?: number,"note"?: string | null,"vat_exemption_limit_huf"?: number,"year"?: number
                  }
                  Relationships: [
                    
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
                },"xp_events": {
                  Row: {
                    "created_at": string,"cycle_started_at": string,"earned_on": string,"id": number,"source": Database["public"]['Enums']["xp_source"],"source_ref": string,"user_id": string,"xp": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"cycle_started_at": string,"earned_on"?: string,"id"?: never,"source": Database["public"]['Enums']["xp_source"],"source_ref": string,"user_id": string,"xp": number
                  }
                  Update: {
                    "created_at"?: string,"cycle_started_at"?: string,"earned_on"?: string,"id"?: never,"source"?: Database["public"]['Enums']["xp_source"],"source_ref"?: string,"user_id"?: string,"xp"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "xp_events_user_id_fkey"
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
            "_award_xp":
{ Args: { "p_on"?: string,"p_ref": string,"p_source": Database["public"]['Enums']["xp_source"],"p_user": string }; Returns: number
                           },
"_leaderboard_scores":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "user_id": string,"xp": number
            }[]
                           },
"_member_week":
{ Args: { "p_stage": number,"p_user": string }; Returns: number
                           },
"_period_start":
{ Args: { "p_day"?: string,"p_period": string }; Returns: string
                           },
"_require_service_role":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"_revenue_status_internal":
{ Args: { "p_year"?: number }; Returns: Json
                           },
"_stage_label":
{ Args: { "p_user": string }; Returns: string
                           },
"accept_hike_invitation":
{ Args: { "p_token": string }; Returns: {
              "attended_at": string | null,
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
"admin_close_destination_poll":
{ Args: { "p_option_id"?: string,"p_poll_id": string }; Returns: {
              "closes_at": string,
"created_at": string,
"description": string | null,
"event_id": string | null,
"id": string,
"month": string,
"opens_at": string,
"title": string,
"winning_option_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "destination_polls"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_close_kind_message":
{ Args: { "p_failed": boolean,"p_message": string,"p_note"?: string }; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_decide_progression":
{ Args: { "p_admin_note"?: string,"p_approve": boolean,"p_request_id": string }; Returns: {
              "admin_note": string | null,
"consultation_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": string,
"note": string | null,
"status": Database["public"]['Enums']["progression_status"],
"target_stage": number,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "progression_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_kind_message_queue":
{ Args: Record<PropertyKey, never>; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }[]
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: false
        isSetofReturn: true
      } },
"admin_quarter_top10":
{ Args: { "p_day"?: string }; Returns: {
              "display_name": string,"email": string,"pos": number,"user_id": string,"xp": number
            }[]
                           },
"admin_record_kind_message_attempt":
{ Args: { "p_message": string,"p_note"?: string,"p_success": boolean }; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } },
"award_external_xp":
{ Args: { "p_on"?: string,"p_ref": string,"p_source": Database["public"]['Enums']["xp_source"],"p_user": string }; Returns: number
                           },
"book_event":
{ Args: { "p_event_id": string }; Returns: {
              "attended_at": string | null,
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
"cancel_hike_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"cancel_my_registration":
{ Args: { "p_registration_id": string }; Returns: {
              "attended_at": string | null,
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
"cast_destination_vote":
{ Args: { "p_option_id": string,"p_poll_id": string }; Returns: {
              "created_at": string,
"option_id": string,
"poll_id": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "destination_votes"
        isOneToOne: true
        isSetofReturn: false
      } },
"community_authors":
{ Args: { "p_ids": (string)[] }; Returns: {
              "current_stage_label": string,"display_name": string,"id": string,"is_current_member": boolean
            }[]
                           },
"compass_questionnaire":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"confirm_kind_message":
{ Args: { "p_token": string }; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } },
"confirm_paid_consultation":
{ Args: { "p_consultation": string,"p_invoice"?: string }; Returns: {
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
"confirm_paid_kind_message":
{ Args: { "p_invoice"?: string,"p_message": string }; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } },
"confirm_registration_payment":
{ Args: { "p_registration_id": string }; Returns: {
              "attended_at": string | null,
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
"create_paid_consultation":
{ Args: { "p_note"?: string,"p_requested_for"?: string,"p_user": string }; Returns: {
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
"create_paid_kind_message":
{ Args: { "p_amount_huf": number,"p_message": string,"p_recipient_name": string,"p_recipient_phone": string,"p_sender": string }; Returns: string
                           },
"current_week":
{ Args: { "p_stage": number }; Returns: number
                           },
"destination_poll_results":
{ Args: { "p_poll_id": string }; Returns: {
              "is_winner": boolean,"name": string,"option_id": string,"votes": number
            }[]
                           },
"has_member_access":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"invite_hike_guest":
{ Args: { "p_event_id": string,"p_guest_email": string,"p_guest_name": string }; Returns: string
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
"leaderboard":
{ Args: { "p_period"?: string }; Returns: Json
                           },
"membership_ended":
{ Args: { "p_user": string }; Returns: {
              "billing_interval": Database["public"]['Enums']["billing_interval"] | null,
"bio": string | null,
"cancel_at_period_end": boolean,
"compass_answers": Json | null,
"compass_completed_at": string | null,
"compass_scores": Json | null,
"consultations_period_start": string | null,
"country": string | null,
"created_at": string,
"current_period_end": string | null,
"current_stage_label": string | null,
"display_name": string,
"email": string,
"first_name": string | null,
"free_consultations_remaining": number,
"free_messages_remaining": number,
"id": string,
"ip3_purchased": boolean,
"ip3_unlocked": boolean,
"ip3_unlocked_at": string | null,
"last_name": string | null,
"leaderboard_hidden": boolean,
"m2_purchased": boolean,
"m2_unlocked": boolean,
"m2_unlocked_at": string | null,
"membership_ended_at": string | null,
"membership_started_at": string | null,
"nickname": string | null,
"order_key": Database["public"]['Enums']["order_key"] | null,
"past_due_since": string | null,
"privat_kozlony_pro": boolean,
"recurring_amount_huf": number | null,
"retreat_unlocked": boolean,
"role": Database["public"]['Enums']["user_role"],
"stripe_customer_id": string | null,
"stripe_subscription_id": string | null,
"subscription_status": Database["public"]['Enums']["subscription_status"],
"tier": Database["public"]['Enums']["membership_tier"],
"trial_ends_at": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"membership_payment_failed":
{ Args: { "p_user": string }; Returns: boolean
                           },
"membership_payment_succeeded":
{ Args: { "p_amount_huf": number,"p_interval": Database["public"]['Enums']["billing_interval"],"p_period_end": string,"p_tier": Database["public"]['Enums']["membership_tier"],"p_user": string }; Returns: {
              "billing_interval": Database["public"]['Enums']["billing_interval"] | null,
"bio": string | null,
"cancel_at_period_end": boolean,
"compass_answers": Json | null,
"compass_completed_at": string | null,
"compass_scores": Json | null,
"consultations_period_start": string | null,
"country": string | null,
"created_at": string,
"current_period_end": string | null,
"current_stage_label": string | null,
"display_name": string,
"email": string,
"first_name": string | null,
"free_consultations_remaining": number,
"free_messages_remaining": number,
"id": string,
"ip3_purchased": boolean,
"ip3_unlocked": boolean,
"ip3_unlocked_at": string | null,
"last_name": string | null,
"leaderboard_hidden": boolean,
"m2_purchased": boolean,
"m2_unlocked": boolean,
"m2_unlocked_at": string | null,
"membership_ended_at": string | null,
"membership_started_at": string | null,
"nickname": string | null,
"order_key": Database["public"]['Enums']["order_key"] | null,
"past_due_since": string | null,
"privat_kozlony_pro": boolean,
"recurring_amount_huf": number | null,
"retreat_unlocked": boolean,
"role": Database["public"]['Enums']["user_role"],
"stripe_customer_id": string | null,
"stripe_subscription_id": string | null,
"subscription_status": Database["public"]['Enums']["subscription_status"],
"tier": Database["public"]['Enums']["membership_tier"],
"trial_ends_at": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"membership_stage_purchased":
{ Args: { "p_code": string,"p_user": string }; Returns: {
              "billing_interval": Database["public"]['Enums']["billing_interval"] | null,
"bio": string | null,
"cancel_at_period_end": boolean,
"compass_answers": Json | null,
"compass_completed_at": string | null,
"compass_scores": Json | null,
"consultations_period_start": string | null,
"country": string | null,
"created_at": string,
"current_period_end": string | null,
"current_stage_label": string | null,
"display_name": string,
"email": string,
"first_name": string | null,
"free_consultations_remaining": number,
"free_messages_remaining": number,
"id": string,
"ip3_purchased": boolean,
"ip3_unlocked": boolean,
"ip3_unlocked_at": string | null,
"last_name": string | null,
"leaderboard_hidden": boolean,
"m2_purchased": boolean,
"m2_unlocked": boolean,
"m2_unlocked_at": string | null,
"membership_ended_at": string | null,
"membership_started_at": string | null,
"nickname": string | null,
"order_key": Database["public"]['Enums']["order_key"] | null,
"past_due_since": string | null,
"privat_kozlony_pro": boolean,
"recurring_amount_huf": number | null,
"retreat_unlocked": boolean,
"role": Database["public"]['Enums']["user_role"],
"stripe_customer_id": string | null,
"stripe_subscription_id": string | null,
"subscription_status": Database["public"]['Enums']["subscription_status"],
"tier": Database["public"]['Enums']["membership_tier"],
"trial_ends_at": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"membership_trial_started":
{ Args: { "p_trial_end": string,"p_user": string }; Returns: {
              "billing_interval": Database["public"]['Enums']["billing_interval"] | null,
"bio": string | null,
"cancel_at_period_end": boolean,
"compass_answers": Json | null,
"compass_completed_at": string | null,
"compass_scores": Json | null,
"consultations_period_start": string | null,
"country": string | null,
"created_at": string,
"current_period_end": string | null,
"current_stage_label": string | null,
"display_name": string,
"email": string,
"first_name": string | null,
"free_consultations_remaining": number,
"free_messages_remaining": number,
"id": string,
"ip3_purchased": boolean,
"ip3_unlocked": boolean,
"ip3_unlocked_at": string | null,
"last_name": string | null,
"leaderboard_hidden": boolean,
"m2_purchased": boolean,
"m2_unlocked": boolean,
"m2_unlocked_at": string | null,
"membership_ended_at": string | null,
"membership_started_at": string | null,
"nickname": string | null,
"order_key": Database["public"]['Enums']["order_key"] | null,
"past_due_since": string | null,
"privat_kozlony_pro": boolean,
"recurring_amount_huf": number | null,
"retreat_unlocked": boolean,
"role": Database["public"]['Enums']["user_role"],
"stripe_customer_id": string | null,
"stripe_subscription_id": string | null,
"subscription_status": Database["public"]['Enums']["subscription_status"],
"tier": Database["public"]['Enums']["membership_tier"],
"trial_ends_at": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"my_character_card":
{ Args: { "p_user"?: string }; Returns: Json
                           },
"participation_score":
{ Args: { "p_user"?: string }; Returns: Json
                           },
"progression_status":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"public_open_evenings":
{ Args: Record<PropertyKey, never>; Returns: {
              "description": string,"ends_at": string,"id": string,"is_online": boolean,"location": string,"price_external_huf": number,"registration_open": boolean,"seats_left": number,"starts_at": string,"title": string
            }[]
                           },
"purge_kind_message_phones":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_unpaid_consultations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_unpaid_kind_messages":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"request_progression":
{ Args: { "p_note"?: string }; Returns: {
              "admin_note": string | null,
"consultation_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": string,
"note": string | null,
"status": Database["public"]['Enums']["progression_status"],
"target_stage": number,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "progression_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"reserve_guest_seat":
{ Args: { "p_event_id": string,"p_guest_email": string,"p_guest_name": string }; Returns: {
              "attended_at": string | null,
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
"run_scheduled_tasks":
{ Args: { "p_now"?: string }; Returns: Json
                           },
"send_free_kind_message":
{ Args: { "p_message": string,"p_recipient_name": string,"p_recipient_phone": string }; Returns: {
              "amount_huf": number,
"attempts": number,
"closed_at": string | null,
"confirm_expires_at": string | null,
"confirm_token_hash": string | null,
"confirmed_at": string | null,
"created_at": string,
"delivered_at": string | null,
"guest_email": string | null,
"guest_name": string | null,
"id": string,
"invoice_id": string | null,
"is_free": boolean,
"kind": Database["public"]['Enums']["kind_message_kind"],
"last_attempt_at": string | null,
"message": string,
"phone_purged_at": string | null,
"recipient_name": string,
"recipient_phone": string | null,
"sender_id": string | null,
"status": Database["public"]['Enums']["kind_message_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "kind_messages"
        isOneToOne: true
        isSetofReturn: false
      } },
"stage_progress":
{ Args: { "p_stage": number }; Returns: Json
                           },
"submit_compass":
{ Args: { "p_answers": Json,"p_tiebreak"?: Database["public"]['Enums']["order_key"] }; Returns: Database["public"]['Enums']["order_key"]
                           },
"submit_kind_message":
{ Args: { "p_guest_email"?: string,"p_guest_name"?: string,"p_message": string,"p_recipient_name": string,"p_recipient_phone": string,"p_sender"?: string }; Returns: {
              "confirm_token": string,"message_id": string,"status": string
            }[]
                           },
"superadmin_set_order":
{ Args: { "p_order": Database["public"]['Enums']["order_key"],"p_user": string }; Returns: {
              "billing_interval": Database["public"]['Enums']["billing_interval"] | null,
"bio": string | null,
"cancel_at_period_end": boolean,
"compass_answers": Json | null,
"compass_completed_at": string | null,
"compass_scores": Json | null,
"consultations_period_start": string | null,
"country": string | null,
"created_at": string,
"current_period_end": string | null,
"current_stage_label": string | null,
"display_name": string,
"email": string,
"first_name": string | null,
"free_consultations_remaining": number,
"free_messages_remaining": number,
"id": string,
"ip3_purchased": boolean,
"ip3_unlocked": boolean,
"ip3_unlocked_at": string | null,
"last_name": string | null,
"leaderboard_hidden": boolean,
"m2_purchased": boolean,
"m2_unlocked": boolean,
"m2_unlocked_at": string | null,
"membership_ended_at": string | null,
"membership_started_at": string | null,
"nickname": string | null,
"order_key": Database["public"]['Enums']["order_key"] | null,
"past_due_since": string | null,
"privat_kozlony_pro": boolean,
"recurring_amount_huf": number | null,
"retreat_unlocked": boolean,
"role": Database["public"]['Enums']["user_role"],
"stripe_customer_id": string | null,
"stripe_subscription_id": string | null,
"subscription_status": Database["public"]['Enums']["subscription_status"],
"tier": Database["public"]['Enums']["membership_tier"],
"trial_ends_at": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "billing_interval": "month"|"year","consultation_status": "requested"|"scheduled"|"done"|"cancelled"|"pending_payment","event_kind": "nyilt_est"|"gyakorlonap"|"elvonulas"|"online_meditacio"|"qa_elo"|"tura","kind_message_kind": "standard"|"priority","kind_message_status": "queued"|"scheduled"|"delivered"|"rejected"|"pending_confirmation"|"followup"|"failed"|"pending_payment","lesson_kind": "video"|"audio"|"text","membership_tier": "none"|"tarsasagi"|"belso_kor","order_key": "tundek"|"kertorzok"|"torpok"|"vandorok","post_kind": "normal"|"penteki_kor","progression_status": "requested"|"scheduled"|"approved"|"declined"|"cancelled","reaction_kind": "koszonom"|"hasonlot","registration_status": "pending_payment"|"confirmed"|"cancelled","revenue_region": "HU"|"EU"|"NON_EU","subscription_status": "none"|"trialing"|"active"|"past_due"|"canceled"|"unpaid"|"incomplete"|"incomplete_expired"|"paused","user_role": "member"|"admin"|"superadmin","xp_source": "lesson"|"ritual"|"knowledge"|"journal"|"kozlony"|"post"|"answer"|"helpful_received"|"friday_circle"|"online_meditation"|"event_attendance"|"hike"|"kind_message"|"stage"
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
            "billing_interval": ["month", "year"],"consultation_status": ["requested", "scheduled", "done", "cancelled", "pending_payment"],"event_kind": ["nyilt_est", "gyakorlonap", "elvonulas", "online_meditacio", "qa_elo", "tura"],"kind_message_kind": ["standard", "priority"],"kind_message_status": ["queued", "scheduled", "delivered", "rejected", "pending_confirmation", "followup", "failed", "pending_payment"],"lesson_kind": ["video", "audio", "text"],"membership_tier": ["none", "tarsasagi", "belso_kor"],"order_key": ["tundek", "kertorzok", "torpok", "vandorok"],"post_kind": ["normal", "penteki_kor"],"progression_status": ["requested", "scheduled", "approved", "declined", "cancelled"],"reaction_kind": ["koszonom", "hasonlot"],"registration_status": ["pending_payment", "confirmed", "cancelled"],"revenue_region": ["HU", "EU", "NON_EU"],"subscription_status": ["none", "trialing", "active", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"],"user_role": ["member", "admin", "superadmin"],"xp_source": ["lesson", "ritual", "knowledge", "journal", "kozlony", "post", "answer", "helpful_received", "friday_circle", "online_meditation", "event_attendance", "hike", "kind_message", "stage"]
          }
        }
} as const
