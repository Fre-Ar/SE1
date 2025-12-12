// Helper to format tags (spaces -> underscores, lowercase)
export const formatTag = (val: string) => val.trim().toLowerCase().replace(/\s+/g, '_');
// Helper to unformat tags (underscores -> spaces, trim)
export const unformatTag = (val: string) => val.replace(/_+/g, ' ').trim();
