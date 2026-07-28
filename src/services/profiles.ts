import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

interface ProfileRow {
    id: string;
    display_name: string | null;
}

export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];          // no ids → skip the query entirely
    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids)                   // ← which column, which array?
    if (error) throw error;
    return (data ?? []).map((row: ProfileRow) => ({
        id: row.id,
        displayName: row.display_name ?? "Unknown",        // ← snake_case → camelCase, handle null
    }));
}
