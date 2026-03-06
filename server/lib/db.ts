import { createClient } from '@supabase/supabase-js';

// These should be set in your environment variables via [Connect Supabase](#open-mcp-popover)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.warn("⚠️  SUPABASE_URL not set in environment variables");
}
if (!supabaseKey) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not set in environment variables");
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? (console.log("✅ Supabase initialized with SERVICE ROLE"), createClient(supabaseUrl, supabaseKey))
  : (console.error("❌ Supabase NOT initialized - missing env vars"), null);

/**
 * DATABASE SCHEMA (Suggested for MCQ Platform)
 * 
 * users:
 *   - id: uuid (primary key)
 *   - username: text (unique)
 *   - elo_rating: integer (default 1200)
 *   - weekly_points: integer (default 0)
 *   - wins: integer (default 0)
 *   - losses: integer (default 0)
 *   - accuracy: float (default 0)
 * 
 * questions:
 *   - id: uuid (primary key)
 *   - category: text
 *   - question_text: text
 *   - options: jsonb (array of strings)
 *   - correct_answer: integer
 *   - explanation: text
 * 
 * matches:
 *   - id: uuid (primary key)
 *   - player1_id: uuid (ref users)
 *   - player2_id: uuid (ref users)
 *   - winner_id: uuid (ref users, nullable)
 *   - p1_score: integer
 *   - p2_score: integer
 *   - created_at: timestamp
 */
