import { supabase } from "../lib/supabase";
import type { Collection } from "../types";

interface CollectionRow {
    id: string;
    name: string;
    description?: string | null;
    owner_id: string;
    is_public: boolean;
    created_at: string;
}

function mapCollection(row: CollectionRow): Collection {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        ownerId: row.owner_id,
        bookIds: [],
        isPublic: row.is_public,
        createdAt: row.created_at,
    };
}

export async function getMyCollections(): Promise<Collection[]> {
    // Without the owner filter this returns every row RLS allows, which
    // includes other people's *public* collections — so "My Collections"
    // listed shelves the signed-in user doesn't own. RLS is still the security
    // boundary (private rows were never exposed); this is what makes the page
    // mean "mine". getSession reads local storage, so it costs no round trip.
    const { data: { session } } = await supabase.auth.getSession();
    const ownerId = session?.user?.id;
    if (!ownerId) return [];

    const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCollection);
}

export async function getPublicCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapCollection);
}

/**
 * Book counts for several collections in one round trip, keyed by collection
 * id. Counting per collection would be a query each; this fetches the whole
 * set of rows once and tallies them client-side.
 */
export async function getBookCountsByCollection(
    collectionIds: string[]
): Promise<Record<string, number>> {
    if (collectionIds.length === 0) return {};
    const { data, error } = await supabase
        .from("collection_books")
        .select("collection_id")
        .in("collection_id", collectionIds);
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const id of collectionIds) counts[id] = 0;
    for (const row of data ?? []) counts[row.collection_id] += 1;
    return counts;
}

export async function getCollectionById(collectionId: string): Promise<Collection> {
    const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();
    if (error) throw error;
    return mapCollection(data);
}

export async function createCollection(name: string, ownerId: string, description?: string, isPublic = false) {
    const { data, error } = await supabase
        .from("collections")
        .insert({ name, description, owner_id: ownerId, is_public: isPublic })
        .select()
        .single();
    if (error) throw error;
    return mapCollection(data);
}

export async function addBookToCollection(collectionId: string, bookId: string) {
    const { error } = await supabase
        .from("collection_books")
        .insert({ collection_id: collectionId, book_id: bookId });
    if (error) throw error;
}

export async function removeBookFromCollection(collectionId: string, bookId: string) {
    const { error } = await supabase
        .from("collection_books")
        .delete()
        .eq("collection_id", collectionId)
        .eq("book_id", bookId);
    if (error) throw error;
}

export async function getBookIdsForCollection(collectionId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("collection_books")
        .select("book_id")
        .eq("collection_id", collectionId);
    if (error) throw error;
    return (data ?? []).map((row) => row.book_id);
}

export async function deleteCollection(collectionId: string) {
    const { error } = await supabase.from("collections").delete().eq("id", collectionId);
    if (error) throw error;
}