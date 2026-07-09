import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { ClinicService, ClinicServiceInput } from '../models/service.model';
import { Faq, FaqInput } from '../models/faq.model';
import {
  DoctorProfileExtension,
  DoctorProfileExtensionInput,
} from '../models/doctor-profile-extension.model';
import { Policy, PolicyInput } from '../models/policy.model';
import { InsuranceProvider, InsuranceProviderInput } from '../models/insurance-provider.model';
import { MessageTemplate, MessageTemplateInput } from '../models/message-template.model';
import { AIPromptSettings, AIPromptSettingsInput } from '../models/ai-prompt-settings.model';

function createMockServices(): ClinicService[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'svc-1',
      name: 'General Consultation',
      category: 'Consultation',
      description: 'Initial assessment with a general physician.',
      durationMinutes: 20,
      price: 500,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'svc-2',
      name: 'Cardiac Screening',
      category: 'Diagnostic',
      description: 'ECG and cardiac risk assessment.',
      durationMinutes: 40,
      price: 1500,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'svc-3',
      name: 'Physiotherapy Session',
      category: 'Therapy',
      description: 'One-on-one physiotherapy session.',
      durationMinutes: 45,
      price: 800,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'svc-4',
      name: 'Minor Procedure',
      category: 'Surgical',
      description: 'Outpatient minor surgical procedure.',
      durationMinutes: 60,
      price: 3000,
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockFaqs(): Faq[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'faq-1',
      question: 'What are your clinic hours?',
      answer: 'We are open Monday to Saturday, 9 AM to 6 PM, with a lunch break 1-2 PM.',
      category: 'General',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'faq-2',
      question: 'Do I need to book an appointment in advance?',
      answer: 'Online booking is available, and walk-ins are accepted subject to availability.',
      category: 'Appointments',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'faq-3',
      question: 'What insurance providers do you accept?',
      answer: 'See the Insurance Providers list for the full, up-to-date set we work with.',
      category: 'Billing',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'faq-4',
      question: 'Can I get a same-day appointment for an emergency?',
      answer: 'Draft answer pending clinical sign-off.',
      category: 'Appointments',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockDoctorProfileExtensions(): DoctorProfileExtension[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'dpe-1',
      doctorId: 'doc-1',
      biography:
        'Dr. Aisha Khan is a cardiologist with over a decade of experience in interventional cardiology.',
      languages: ['English', 'Hindi', 'Urdu'],
      awards: ['Best Cardiologist - Mumbai Health Awards 2022'],
      certifications: ['Fellow of the American College of Cardiology'],
      publications: ['Outcomes of Early PCI in Acute MI, Indian Heart Journal, 2019'],
      interests: ['Preventive cardiology', 'Medical education'],
      videoUrl: '',
      displayPriority: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dpe-2',
      doctorId: 'doc-3',
      biography:
        'Dr. Priya Nair specializes in pediatric care with a focus on early childhood development.',
      languages: ['English', 'Malayalam', 'Hindi'],
      awards: [],
      certifications: ['Diploma in Child Health'],
      publications: [],
      interests: ['Child nutrition'],
      videoUrl: '',
      displayPriority: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockPolicies(): Policy[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'pol-1',
      title: 'Appointment Cancellation Policy',
      type: 'cancellation',
      content: 'Cancellations made less than 4 hours before the appointment may incur a fee.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pol-2',
      title: 'Refund Policy',
      type: 'refund',
      content: 'Refunds for prepaid services are processed within 7 business days.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pol-3',
      title: 'Patient Privacy Policy',
      type: 'privacy',
      content: 'Patient records are confidential and shared only with treating clinicians.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pol-4',
      title: 'Insurance Claims Policy',
      type: 'insurance',
      content: 'Cashless claims are supported for empanelled insurance providers only.',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockInsuranceProviders(): InsuranceProvider[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'ins-1',
      name: 'Star Health Insurance',
      contactPerson: 'Neha Joshi',
      phone: '+91 90000 11111',
      email: 'partnerships@starhealth.example',
      website: 'https://starhealth.example',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ins-2',
      name: 'ICICI Lombard',
      contactPerson: 'Karan Mehra',
      phone: '+91 90000 22222',
      email: 'network@icicilombard.example',
      website: 'https://icicilombard.example',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ins-3',
      name: 'HDFC Ergo',
      contactPerson: 'Simran Kaur',
      phone: '+91 90000 33333',
      email: 'network@hdfcergo.example',
      website: 'https://hdfcergo.example',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockMessageTemplates(): MessageTemplate[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'tmpl-1',
      name: 'Appointment Confirmation - Default',
      type: 'appointment_confirmation',
      subject: 'Your appointment is confirmed',
      body: 'Hi {{patientName}}, your appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}} is confirmed.',
      variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tmpl-2',
      name: 'Appointment Reminder - 24h',
      type: 'reminder',
      subject: 'Appointment reminder',
      body: 'Hi {{patientName}}, this is a reminder for your appointment with {{doctorName}} tomorrow at {{appointmentTime}}.',
      variables: ['patientName', 'doctorName', 'appointmentTime'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tmpl-3',
      name: 'Welcome Message',
      type: 'welcome',
      subject: 'Welcome to Kapis Clinic',
      body: 'Hi {{patientName}}, welcome to Kapis Clinic! We look forward to caring for you.',
      variables: ['patientName'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockAIPromptSettings(): AIPromptSettings {
  return {
    clinicPersonality:
      'Warm, professional, and reassuring - like a trusted front-desk coordinator.',
    tone: 'Friendly and concise',
    greeting: 'Hello! Welcome to Kapis Clinic AI. How can I help you today?',
    fallbackMessage: "I'm not sure about that - let me connect you with our front desk team.",
    emergencyInstructions:
      'If this is a medical emergency, please call emergency services immediately or visit the nearest ER.',
    escalationRules:
      'Escalate to a human receptionist for billing disputes, complaints, or emergencies.',
    systemPrompt:
      'You are the AI receptionist for Kapis Clinic. Be helpful, accurate, and defer to clinical staff for medical advice.',
    enabled: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sprint 7 has no backend, so every entity lives in its own signal, seeded
 * once from mock data - same shape as `DoctorService`/`UserService`. Unlike
 * Sprint 6 (three services split by ownership), this sprint's brief asks for
 * a single `KnowledgeBaseService` covering all seven knowledge-base entities,
 * since none of them have enough independent lifecycle to justify a split
 * yet; that can change later the same way Settings did.
 */
@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  private readonly _services = signal<ClinicService[]>(createMockServices());
  private readonly _faqs = signal<Faq[]>(createMockFaqs());
  private readonly _doctorProfileExtensions = signal<DoctorProfileExtension[]>(
    createMockDoctorProfileExtensions(),
  );
  private readonly _policies = signal<Policy[]>(createMockPolicies());
  private readonly _insuranceProviders = signal<InsuranceProvider[]>(
    createMockInsuranceProviders(),
  );
  private readonly _messageTemplates = signal<MessageTemplate[]>(createMockMessageTemplates());
  private readonly _aiPromptSettings = signal<AIPromptSettings>(createMockAIPromptSettings());

  readonly services = this._services.asReadonly();
  readonly serviceCount = computed(() => this._services().length);

  readonly faqs = this._faqs.asReadonly();
  readonly faqCount = computed(() => this._faqs().length);

  readonly doctorProfileExtensions = this._doctorProfileExtensions.asReadonly();

  readonly policies = this._policies.asReadonly();

  readonly insuranceProviders = this._insuranceProviders.asReadonly();

  readonly messageTemplates = this._messageTemplates.asReadonly();
  readonly templateCount = computed(() => this._messageTemplates().length);

  // ---- Services ----

  getServices(): Observable<ClinicService[]> {
    return of(this._services()).pipe(delay(300));
  }

  createService(input: ClinicServiceInput): Observable<ClinicService> {
    const now = new Date().toISOString();
    const service: ClinicService = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(service).pipe(
      delay(300),
      tap((created) => this._services.update((services) => [...services, created])),
    );
  }

  updateService(id: string, input: ClinicServiceInput): Observable<ClinicService> {
    const existing = this._services().find((service) => service.id === id);

    if (!existing) {
      return throwError(() => new Error(`Service "${id}" was not found.`));
    }

    const updated: ClinicService = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((service) =>
        this._services.update((services) => services.map((s) => (s.id === id ? service : s))),
      ),
    );
  }

  deleteService(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._services.update((services) => services.filter((s) => s.id !== id))),
    );
  }

  // ---- FAQs ----

  getFaqs(): Observable<Faq[]> {
    return of(this._faqs()).pipe(delay(300));
  }

  createFaq(input: FaqInput): Observable<Faq> {
    const now = new Date().toISOString();
    const faq: Faq = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(faq).pipe(
      delay(300),
      tap((created) => this._faqs.update((faqs) => [...faqs, created])),
    );
  }

  updateFaq(id: string, input: FaqInput): Observable<Faq> {
    const existing = this._faqs().find((faq) => faq.id === id);

    if (!existing) {
      return throwError(() => new Error(`FAQ "${id}" was not found.`));
    }

    const updated: Faq = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((faq) => this._faqs.update((faqs) => faqs.map((f) => (f.id === id ? faq : f)))),
    );
  }

  deleteFaq(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._faqs.update((faqs) => faqs.filter((f) => f.id !== id))),
    );
  }

  // ---- Doctor Profile Extensions ----

  getDoctorProfileExtensions(): Observable<DoctorProfileExtension[]> {
    return of(this._doctorProfileExtensions()).pipe(delay(300));
  }

  getDoctorProfileExtension(doctorId: string): DoctorProfileExtension | undefined {
    return this._doctorProfileExtensions().find((extension) => extension.doctorId === doctorId);
  }

  /** Creates the extension row if the doctor has none yet, otherwise updates the existing one - a single call keeps the doctor-profiles page from needing to know which case applies. */
  saveDoctorProfileExtension(
    input: DoctorProfileExtensionInput,
  ): Observable<DoctorProfileExtension> {
    const now = new Date().toISOString();
    const existing = this._doctorProfileExtensions().find(
      (extension) => extension.doctorId === input.doctorId,
    );

    const saved: DoctorProfileExtension = existing
      ? { ...existing, ...input, updatedAt: now }
      : { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(saved).pipe(
      delay(300),
      tap((result) =>
        this._doctorProfileExtensions.update((extensions) =>
          existing
            ? extensions.map((extension) =>
                extension.doctorId === input.doctorId ? result : extension,
              )
            : [...extensions, result],
        ),
      ),
    );
  }

  // ---- Policies ----

  getPolicies(): Observable<Policy[]> {
    return of(this._policies()).pipe(delay(300));
  }

  createPolicy(input: PolicyInput): Observable<Policy> {
    const now = new Date().toISOString();
    const policy: Policy = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(policy).pipe(
      delay(300),
      tap((created) => this._policies.update((policies) => [...policies, created])),
    );
  }

  updatePolicy(id: string, input: PolicyInput): Observable<Policy> {
    const existing = this._policies().find((policy) => policy.id === id);

    if (!existing) {
      return throwError(() => new Error(`Policy "${id}" was not found.`));
    }

    const updated: Policy = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((policy) =>
        this._policies.update((policies) => policies.map((p) => (p.id === id ? policy : p))),
      ),
    );
  }

  deletePolicy(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._policies.update((policies) => policies.filter((p) => p.id !== id))),
    );
  }

  // ---- Insurance Providers ----

  getInsuranceProviders(): Observable<InsuranceProvider[]> {
    return of(this._insuranceProviders()).pipe(delay(300));
  }

  createInsuranceProvider(input: InsuranceProviderInput): Observable<InsuranceProvider> {
    const now = new Date().toISOString();
    const provider: InsuranceProvider = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(provider).pipe(
      delay(300),
      tap((created) => this._insuranceProviders.update((providers) => [...providers, created])),
    );
  }

  updateInsuranceProvider(
    id: string,
    input: InsuranceProviderInput,
  ): Observable<InsuranceProvider> {
    const existing = this._insuranceProviders().find((provider) => provider.id === id);

    if (!existing) {
      return throwError(() => new Error(`Insurance provider "${id}" was not found.`));
    }

    const updated: InsuranceProvider = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(300),
      tap((provider) =>
        this._insuranceProviders.update((providers) =>
          providers.map((p) => (p.id === id ? provider : p)),
        ),
      ),
    );
  }

  deleteInsuranceProvider(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() =>
        this._insuranceProviders.update((providers) => providers.filter((p) => p.id !== id)),
      ),
    );
  }

  // ---- Message Templates ----

  getMessageTemplates(): Observable<MessageTemplate[]> {
    return of(this._messageTemplates()).pipe(delay(300));
  }

  createMessageTemplate(input: MessageTemplateInput): Observable<MessageTemplate> {
    const now = new Date().toISOString();
    const template: MessageTemplate = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(template).pipe(
      delay(300),
      tap((created) => this._messageTemplates.update((templates) => [...templates, created])),
    );
  }

  updateMessageTemplate(id: string, input: MessageTemplateInput): Observable<MessageTemplate> {
    const existing = this._messageTemplates().find((template) => template.id === id);

    if (!existing) {
      return throwError(() => new Error(`Message template "${id}" was not found.`));
    }

    const updated: MessageTemplate = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((template) =>
        this._messageTemplates.update((templates) =>
          templates.map((t) => (t.id === id ? template : t)),
        ),
      ),
    );
  }

  deleteMessageTemplate(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._messageTemplates.update((templates) => templates.filter((t) => t.id !== id))),
    );
  }

  // ---- AI Prompt Settings ----

  getAiPromptSettings(): Observable<AIPromptSettings> {
    return of(this._aiPromptSettings()).pipe(delay(300));
  }

  updateAiPromptSettings(input: AIPromptSettingsInput): Observable<AIPromptSettings> {
    const updated: AIPromptSettings = { ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((settings) => this._aiPromptSettings.set(settings)),
    );
  }
}
