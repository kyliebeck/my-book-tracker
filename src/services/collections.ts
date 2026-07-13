import { supabase } from "../lib/supabase";


export async function getMyCollections() {
    const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

export async function createCollection(name: string, ownerId: string, description?: string) {
    const { data, error } = await supabase
        .from("collections")
        .insert({ name, description, owner_id: ownerId })
        .select()
        .single();
    if (error) throw error;
    return data;
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

export async function deleteCollection(collectionId: string) {
    const { error } = await supabase.from("collections").delete().eq("id", collectionId);
    if (error) throw error;
}