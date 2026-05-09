import { supabase } from '../lib/supabaseClient';
import {
  assertNoError,
  getAuthenticatedAuthUser,
  runLoggedOperation,
} from './serviceUtils';

export interface HistoryItem {
  id: string;
  user_id: string;
  type: 'resume' | 'interview';
  reference_id: string;
  created_at: string;
}

class HistoryService {
  async getHistory() {
    return runLoggedOperation(
      'historyService',
      'getHistory',
      undefined,
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        assertNoError(error, 'Unable to load history.');
        return (data as HistoryItem[] | null) || [];
      },
    );
  }
}

export const historyService = new HistoryService();
