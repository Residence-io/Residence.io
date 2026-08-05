import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';

const signatures: Array<{
  mediaType: string;
  matches: (buffer: Buffer) => boolean;
}> = [
  {
    mediaType: 'application/pdf',
    matches: (b) => b.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  {
    mediaType: 'image/png',
    matches: (b) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mediaType: 'image/jpeg',
    matches: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
];

/**
 * Phase S4: Shadow-mode Supabase Storage
 *
 * When FEATURE_SUPABASE_STORAGE=true, every new upload is mirrored to
 * Supabase Storage alongside the local disk copy.  Reads still come from
 * disk unless a signed-URL is explicitly requested.
 *
 * Supabase path convention:
 *   resident-documents : <societyId>/residents/<ownerId>/<uuid>.<ext>
 *   generated-pdfs     : <societyId>/generated/<ownerId>/<filename>
 */
@Injectable()
export class PrivateStorageService implements OnModuleInit {
  private readonly logger = new Logger(PrivateStorageService.name);
  private readonly root: string;
  readonly maxBytes: number;

  constructor(
    private readonly config: ConfigService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {
    this.root = resolve(config.getOrThrow<string>('resident.storage.root'));
    this.maxBytes = config.getOrThrow<number>('resident.storage.maxBytes');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await access(this.root, constants.R_OK | constants.W_OK);
  }

  async store(
    ownerId: string,
    buffer: Buffer,
    originalName: string,
    claimedMediaType?: string,
    /** societyId is required for Supabase shadow upload */
    societyId?: string,
  ) {
    if (!buffer.length)
      throw new BadRequestException('The uploaded file is empty.');
    if (buffer.length > this.maxBytes)
      throw new BadRequestException(
        `The uploaded file exceeds the ${this.maxBytes}-byte limit.`,
      );
    const detected = signatures.find((signature) => signature.matches(buffer));
    if (!detected)
      throw new BadRequestException(
        'Only valid PDF, PNG, and JPEG files are accepted.',
      );
    if (
      claimedMediaType &&
      claimedMediaType !== 'application/octet-stream' &&
      claimedMediaType !== detected.mediaType
    )
      throw new BadRequestException(
        'The file content does not match its declared type.',
      );
    const extension =
      detected.mediaType === 'application/pdf'
        ? '.pdf'
        : detected.mediaType === 'image/png'
          ? '.png'
          : '.jpg';
    const objectKey = `${ownerId}/${randomUUID()}${extension}`;
    const path = this.safePath(objectKey);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, buffer, { flag: 'wx' });

    // Phase S4: Shadow upload to Supabase Storage
    if (this.supabaseAdmin.isStorageEnabled && societyId) {
      void this.shadowUpload(
        'resident-documents',
        this.toSupabasePath('residents', societyId, ownerId, objectKey),
        buffer,
        detected.mediaType,
      );
    }

    return {
      objectKey,
      mediaType: detected.mediaType,
      sizeBytes: buffer.length,
      checksumSha256: createHash('sha256').update(buffer).digest('hex'),
      originalFileName: this.safeName(originalName),
    };
  }

  /**
   * Store a server-generated file (PDF) to Supabase Storage.
   * Used for ID cards, receipts, salary slips.
   * Bucket: generated-pdfs
   */
  async storeGenerated(
    ownerId: string,
    buffer: Buffer,
    originalName: string,
    claimedMediaType?: string,
    societyId?: string,
  ) {
    const result = await this.store(
      ownerId,
      buffer,
      originalName,
      claimedMediaType,
      undefined, // skip resident-documents shadow for generated files
    );

    // Phase S4: shadow upload to generated-pdfs bucket
    if (this.supabaseAdmin.isStorageEnabled && societyId) {
      const filename = result.objectKey.split('/')[1] ?? result.objectKey;
      const supabasePath = `${societyId}/generated/${ownerId}/${filename}`;
      void this.shadowUpload(
        'generated-pdfs',
        supabasePath,
        buffer,
        result.mediaType,
      );
    }

    return result;
  }

  async read(objectKey: string): Promise<Buffer> {
    const path = this.safePath(objectKey);
    try {
      return await readFile(path);
    } catch {
      throw new NotFoundException('The requested private file is unavailable.');
    }
  }

  async remove(objectKey: string): Promise<void> {
    await rm(this.safePath(objectKey), { force: true });
  }

  /**
   * Phase S4: Generate a short-lived Supabase signed URL for a document.
   * Returns null when storage is disabled or signing fails.
   * @param bucket 'resident-documents' | 'generated-pdfs'
   * @param supabasePath Full path inside the bucket
   * @param expiresInSeconds Default: 3600 (1 hour)
   */
  async signedUrl(
    bucket: string,
    supabasePath: string,
    expiresInSeconds = 3_600,
  ): Promise<string | null> {
    if (!this.supabaseAdmin.isStorageEnabled) return null;
    try {
      const { data, error } = await this.supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(supabasePath, expiresInSeconds);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }

  /**
   * Build Supabase path for resident documents.
   * @example toSupabasePath('residents', societyId, ownerId, 'abc/file.pdf') => 'societyId/residents/ownerId/file.pdf'
   */
  toSupabasePath(
    domain: 'residents' | 'generated',
    societyId: string,
    ownerId: string,
    objectKey: string,
  ): string {
    const filename = objectKey.includes('/')
      ? objectKey.split('/')[1]
      : objectKey;
    return `${societyId}/${domain}/${ownerId}/${filename ?? objectKey}`;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async shadowUpload(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseAdmin.storage
        .from(bucket)
        .upload(path, buffer, { contentType, upsert: true });
      if (error) {
        this.logger.warn(
          `Shadow upload failed [${bucket}/${path}]: ${error.message}`,
        );
      } else {
        this.logger.debug(`Shadow upload OK [${bucket}/${path}]`);
      }
    } catch (err) {
      this.logger.warn(
        `Shadow upload exception [${bucket}/${path}]: ${String(err)}`,
      );
    }
  }

  private safePath(objectKey: string): string {
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|png|jpg)$/i.test(objectKey))
      throw new BadRequestException('Invalid private object reference.');
    const target = resolve(this.root, objectKey);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new BadRequestException('Invalid private object reference.');
    return target;
  }

  private safeName(name: string): string {
    return name.replace(/[\r\n"\\/]/g, '_').slice(0, 255) || 'document';
  }
}
