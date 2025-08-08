import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxpmcttorpjbwfbxrstl.supabase.co'
const supabaseKey = 'sb_publishable_FWdd6UjiZJAGQX1aH_pLjw_xtSROVfM'
export const supabase = createClient(supabaseUrl, supabaseKey)