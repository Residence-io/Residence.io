import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Provides the Supabase Admin client (service_role key).
 * Only used server-side — never exposed to clients.
 * Used for: creating auth users during migration, generating admin sessions.
 */
@Injectable()
export class SupabaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private _client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('supabase.url');
    const key = this.config.get<string>('supabase.serviceRoleKey');
    const enabled = this.config.get<boolean>('supabase.authEnabled', false);

    if (!enabled) {
      this.logger.log(
        'Supabase Auth is disabled (FEATURE_SUPABASE_AUTH=false). Admin client not initialized.',
      );
      return;
    }

    if (!url || !key) {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Supabase admin client not initialized.',
      );
      return;
    }

    this._client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.logger.log('Supabase Admin client initialized.');
  }

  get client(): SupabaseClient {
    if (!this._client) {
      throw new Error(
        'Supabase Admin client is not initialized. ' +
          'Ensure FEATURE_SUPABASE_AUTH=true and Supabase credentials are set.',
      );
    }
    return this._client;
  }

  /**
   * Access the GoTrueAdminApi (user management, session creation, etc.)
   * Only available when the client is initialized with a service_role key.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get admin(): any {
    return (this.client.auth as unknown as { admin: unknown }).admin;
  }

  /** Supabase Storage API. Use for shadow-uploading files in S4. */
  get storage() {
    return this.client.storage;
  }

  get isEnabled(): boolean {
    return this._client !== null;
  }

  get isStorageEnabled(): boolean {
    return (
      this._client !== null &&
      this.config.get<boolean>('supabase.storageEnabled', false) === true
    );
  }
}
