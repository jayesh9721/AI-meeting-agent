import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Utility to log activities across the app
 */
export const logActivity = async ({ type, title, description, user_name, user_email, metadata = {} }) => {
  try {
    const { error } = await supabase.from('activity_logs').insert([{
      type,
      title,
      description,
      user_name,
      user_email,
      metadata
    }]);
    if (error) console.error('Error logging activity:', error);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
