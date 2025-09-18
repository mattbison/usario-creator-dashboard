import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrcworljbjhinxcncmsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY3dvcmxqYmpoaW54Y25jbXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzAxODAsImV4cCI6MjA3MzY0NjE4MH0.yDEjI9ZWnhFsmJWoxBPSJy9VY1NEr4RdqimAWGIII3A';

const supabase = createClient(supabaseUrl, supabaseKey);

export const useRealtime = (table, callback) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload);
          if (callback) {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [table, callback]);

  return { isConnected };
};

export const useInfluencersRealtime = (onUpdate) => {
  return useRealtime('influencers', onUpdate);
};

export const useSubmissionsRealtime = (onUpdate) => {
  return useRealtime('submissions', onUpdate);
};

export const useClientsRealtime = (onUpdate) => {
  return useRealtime('clients', onUpdate);
};

export default useRealtime;

