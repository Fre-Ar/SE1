// __mocks__/next/cache.ts

export const revalidatePath = jest.fn();
export const revalidateTag = jest.fn();
export const unstable_cache = jest.fn((fn) => fn);
