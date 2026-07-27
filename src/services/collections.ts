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
    const { data, error } = await supabase
        .from("collections")
        .select("*")
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