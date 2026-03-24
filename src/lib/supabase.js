import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://uzralvvfiazcnfmmspjv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cmFsdnZmaWF6Y25mbW1zcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODA1OTQsImV4cCI6MjA4OTg1NjU5NH0.E6Z1IjX6csBi3PPoK3JADEjKhz7hHK-Fd8UQ9j0ewGM'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
