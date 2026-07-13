export interface Collection {
    id: string;
    name: string;
    description?: string;
    ownerId: string;      // which user owns it
    bookIds: string[];    // the books in this collection, by id
    isPublic: boolean;    // shared with community or private
    createdAt: string;
}