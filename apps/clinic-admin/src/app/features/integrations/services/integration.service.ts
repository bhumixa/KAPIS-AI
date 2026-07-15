import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { IntegrationTestResult } from '../models/integration-status.model';
import {
  WhatsAppIntegration,
  WhatsAppIntegrationInput,
} from '../models/whatsapp-integration.model';
import { ClaudeIntegration, ClaudeIntegrationInput } from '../models/claude-integration.model';
import { Webhook, WebhookInput } from '../models/webhook.model';

function createMockWhatsApp(): WhatsAppIntegration {
  return {
    businessNumber: '+91 22 4000 1234',
    phoneNumberId: '109876543210987',
    wabaId: '123456789012345',
    webhookUrl: '',
    status: 'connected',
    updatedAt: new Date().toISOString(),
  };
}

function createMockClaude(): ClaudeIntegration {
  return {
    model: 'gemini-2.5-flash',
    maxTokens: 1024,
    temperature: 0.4,
    enabled: true,
    status: 'connected',
    updatedAt: new Date().toISOString(),
  };
}

function createMockWebhooks(): Webhook[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'wh-1',
      name: 'Appointment Sync',
      url: 'https://hooks.kapis.clinic/appointment-sync',
      secret: 'whsec_appointment_sync',
      status: 'active',
      events: ['appointment.created', 'appointment.updated', 'appointment.cancelled'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'wh-2',
      name: 'WhatsApp Inbound Relay',
      url: 'https://hooks.kapis.clinic/whatsapp-relay',
      secret: 'whsec_whatsapp_relay',
      status: 'active',
      events: ['message.received'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'wh-3',
      name: 'Billing Notifier (paused)',
      url: 'https://hooks.kapis.clinic/billing-notifier',
      secret: 'whsec_billing_notifier',
      status: 'inactive',
      events: ['payment.completed'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Sprint 8 has no backend and no external API calls - `testWhatsAppConnection()`/
 * `testClaudeConnection()` are mocked (`delay()` + a canned success result)
 * exactly the way every other CRUD method in this codebase mocks a future
 * `HttpClient` call. One service covers WhatsApp/Claude/Webhooks, the same
 * single-service shape Sprint 7's `KnowledgeBaseService` used - none of them
 * has enough independent lifecycle yet to justify a split. Google Calendar
 * moved out to its own real `GoogleCalendarService` in Sprint 22 (see
 * features/integrations/services/google-calendar.service.ts) once it got a
 * real backend - this service no longer mocks it.
 */
@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private readonly _whatsapp = signal<WhatsAppIntegration>(createMockWhatsApp());
  private readonly _claude = signal<ClaudeIntegration>(createMockClaude());
  private readonly _webhooks = signal<Webhook[]>(createMockWebhooks());

  readonly whatsapp = this._whatsapp.asReadonly();
  readonly claude = this._claude.asReadonly();
  readonly webhooks = this._webhooks.asReadonly();

  readonly webhookCount = computed(() => this._webhooks().length);
  readonly activeWebhookCount = computed(
    () => this._webhooks().filter((webhook) => webhook.status === 'active').length,
  );

  // ---- WhatsApp ----

  getWhatsAppIntegration(): Observable<WhatsAppIntegration> {
    return of(this._whatsapp()).pipe(delay(300));
  }

  updateWhatsAppIntegration(input: WhatsAppIntegrationInput): Observable<WhatsAppIntegration> {
    const updated: WhatsAppIntegration = {
      ...input,
      status: this._whatsapp().status,
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(300),
      tap((integration) => this._whatsapp.set(integration)),
    );
  }

  testWhatsAppConnection(): Observable<IntegrationTestResult> {
    const result: IntegrationTestResult = {
      success: true,
      message: 'WhatsApp Cloud API connection verified (mock).',
      testedAt: new Date().toISOString(),
    };

    return of(result).pipe(
      delay(600),
      tap(() =>
        this._whatsapp.update((integration) => ({
          ...integration,
          status: 'connected',
          updatedAt: result.testedAt,
        })),
      ),
    );
  }

  // ---- Claude ----

  getClaudeIntegration(): Observable<ClaudeIntegration> {
    return of(this._claude()).pipe(delay(300));
  }

  updateClaudeIntegration(input: ClaudeIntegrationInput): Observable<ClaudeIntegration> {
    const updated: ClaudeIntegration = {
      ...input,
      status: this._claude().status,
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(300),
      tap((integration) => this._claude.set(integration)),
    );
  }

  testClaudeConnection(): Observable<IntegrationTestResult> {
    const result: IntegrationTestResult = {
      success: true,
      message: 'Gemini API connection verified (mock).',
      testedAt: new Date().toISOString(),
    };

    return of(result).pipe(
      delay(600),
      tap(() =>
        this._claude.update((integration) => ({
          ...integration,
          status: 'connected',
          updatedAt: result.testedAt,
        })),
      ),
    );
  }

  // ---- Webhooks ----

  getWebhooks(): Observable<Webhook[]> {
    return of(this._webhooks()).pipe(delay(300));
  }

  createWebhook(input: WebhookInput): Observable<Webhook> {
    const now = new Date().toISOString();
    const webhook: Webhook = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(webhook).pipe(
      delay(300),
      tap((created) => this._webhooks.update((webhooks) => [...webhooks, created])),
    );
  }

  updateWebhook(id: string, input: WebhookInput): Observable<Webhook> {
    const existing = this._webhooks().find((webhook) => webhook.id === id);

    if (!existing) {
      return throwError(() => new Error(`Webhook "${id}" was not found.`));
    }

    const updated: Webhook = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((webhook) =>
        this._webhooks.update((webhooks) => webhooks.map((w) => (w.id === id ? webhook : w))),
      ),
    );
  }

  deleteWebhook(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._webhooks.update((webhooks) => webhooks.filter((w) => w.id !== id))),
    );
  }
}
