import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { error } = await supabase.from("receipts").select("id").limit(1);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, pinged_at: new Date().toISOString() });
}
