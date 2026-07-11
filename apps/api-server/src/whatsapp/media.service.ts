import { Injectable } from '@nestjs/common';
import { WhatsappMediaType } from './dto/media-message.dto';
import { WhatsappRepository } from './whatsapp.repository';

// Meta's incoming media object shape (message.image / message.document in a
// webhook payload) - deliberately distinct from MediaMessageDto (the
// outgoing, link-based shape), see that DTO's doc comment.
export interface IncomingMediaPayload {
  id: string;
  mime_type?: string;
  sha256?: string;
  caption?: string;
  filename?: string;
}

// Owns clinic.whatsapp_media exclusively - metadata only, both directions.
// Never resolves Meta's short-lived CDN URL or downloads a byte of the
// actual file (see 041_create_whatsapp_media.sql's header comment) - the
// Sprint 20 brief's "Receive Media Metadata" / "Image metadata" / "Document
// metadata" stop at the fields Meta already hands over inline.
@Injectable()
export class MediaService {
  constructor(private readonly whatsappRepository: WhatsappRepository) {}

  persistIncoming(
    whatsappMessageId: string,
    mediaType: WhatsappMediaType,
    media: IncomingMediaPayload,
  ): Promise<void> {
    return this.whatsappRepository
      .createMedia({
        whatsappMessageId,
        mediaId: media.id,
        mediaType,
        mimeType: media.mime_type ?? '',
        sha256: media.sha256 ?? '',
        caption: media.caption ?? '',
        filename: media.filename ?? '',
      })
      .then(() => undefined);
  }

  persistOutgoing(
    whatsappMessageId: string,
    mediaType: WhatsappMediaType,
    link: string,
    caption?: string,
    filename?: string,
  ): Promise<void> {
    return this.whatsappRepository
      .createMedia({
        whatsappMessageId,
        mediaId: '',
        mediaType,
        link,
        caption: caption ?? '',
        filename: filename ?? '',
      })
      .then(() => undefined);
  }
}
