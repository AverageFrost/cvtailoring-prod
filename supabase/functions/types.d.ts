// Deno global namespace declaration
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
}

// Declaration for Deno modules
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.31.0" {
  export interface SupabaseClient {
    storage: {
      from(bucket: string): {
        upload(path: string, data: ArrayBuffer | Uint8Array, options?: any): Promise<any>;
      };
    };
    from(table: string): {
      insert(data: any): Promise<any>;
    };
  }
  
  export function createClient(url: string, key: string): SupabaseClient;
} 