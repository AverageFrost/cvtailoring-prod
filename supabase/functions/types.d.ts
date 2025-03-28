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

// Declaration for docx module
declare module "https://esm.sh/docx@8.2.0" {
  export interface Paragraph {
    text?: string;
    heading?: number;
    spacing?: {
      after?: number;
      before?: number;
    };
    children?: any[];
  }

  export class Document {
    constructor(options: {
      sections: Array<{
        properties: any;
        children: any[];
      }>;
    });
  }

  export class TextRun {
    constructor(text: string | {
      text: string;
      bold?: boolean;
      italics?: boolean;
    });
  }

  export class Paragraph {
    constructor(options: Paragraph);
  }

  export enum HeadingLevel {
    HEADING_1 = 0,
    HEADING_2 = 1,
    HEADING_3 = 2,
    HEADING_4 = 3,
    HEADING_5 = 4,
    HEADING_6 = 5,
    TITLE = 6
  }

  export class Packer {
    static toBuffer(doc: Document): Promise<Uint8Array>;
  }
} 