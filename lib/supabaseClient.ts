// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aqhrurbphpxqglnlfvcu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaHJ1cmJwaHB4cWdsbmxmdmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNzU5NzcsImV4cCI6MjA2NDg1MTk3N30.LlHzJgoqdP2PJGPGfhYkapAjtDiK-h4QdC74l8MCPIw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
