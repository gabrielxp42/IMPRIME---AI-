
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvvwhponzqfyhhntfxvf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dndocG9uenFmeWhobnRmeHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjI4ODYsImV4cCI6MjA4MjY5ODg4Nn0.Tv2z3-FLdTwz1Y0y7IK3mJA3vP93B6i5Sy-F2mHQsF4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
