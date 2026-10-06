import type { RpcClient, RpcResult } from './types';

const rpc = async <T extends RpcResult>(
  client: RpcClient,
  functionName: string,
  params: Record<string, unknown>,
): Promise<T> => {
  const { data, error } = await client.rpc<T>(functionName, params);

  if (error) {
    throw new Error(`Supabase RPC ${functionName} failed: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Supabase RPC ${functionName} returned no data`);
  }

  return data;
};

export const updateBookCopies = (
  client: RpcClient,
  bookId: string,
  newTotal: number,
): Promise<RpcResult> =>
  rpc(client, 'update_book_copies', {
    p_book: bookId,
    p_new_total: newTotal,
  });

export const deleteBook = (
  client: RpcClient,
  bookId: string,
): Promise<RpcResult> => rpc(client, 'delete_book', { p_book: bookId });
