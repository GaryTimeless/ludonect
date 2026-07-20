import crypto from 'crypto';

export interface Instance {
  id: string;
  ownerEmail: string;
  code: string;          // 6-stellig, alphanumerisch
  subdomain: string;
  eventName: string;
  questionSet: string;   // 'basic', 'SmartCoachBerlin', oder custom
  tier: 'custom';
  active: boolean;
  createdAt: number;
  expiresAt: number | null;
  maxRooms: number;
  duration: string;      // '48h', '7d', '30d'
}

export class InstanceManager {
  private instances = new Map<string, Instance>();
  private bySubdomain = new Map<string, string>(); // subdomain → code

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // keine 0/O, 1/I/L für Lesbarkeit
    for (let attempt = 0; attempt < 100; attempt++) {
      const bytes = crypto.randomBytes(6);
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[bytes[i] % chars.length];
      }
      if (!this.instances.has(code)) {
        return code;
      }
    }
    throw new Error('Could not generate unique code after 100 attempts');
  }

  createInstance(params: {
    email: string;
    subdomain: string;
    eventName: string;
    duration: string;
    questionSet: string;
  }): Instance {
    // Check subdomain uniqueness
    if (this.bySubdomain.has(params.subdomain)) {
      throw new Error(`Subdomain "${params.subdomain}" is already taken`);
    }

    // Calculate expiry
    let expiresAt: number | null = null;
    const now = Date.now();
    switch (params.duration) {
      case '24h': expiresAt = now + 24 * 60 * 60 * 1000; break;
      case '48h': expiresAt = now + 48 * 60 * 60 * 1000; break;
      case '7d':  expiresAt = now + 7 * 24 * 60 * 60 * 1000; break;
      case '30d': expiresAt = now + 30 * 24 * 60 * 60 * 1000; break;
      default:    expiresAt = now + 24 * 60 * 60 * 1000;
    }

    const code = this.generateCode();
    const instance: Instance = {
      id: crypto.randomUUID(),
      ownerEmail: params.email,
      code,
      subdomain: params.subdomain,
      eventName: params.eventName,
      questionSet: params.questionSet || 'basic',
      tier: 'custom',
      active: true,
      createdAt: now,
      expiresAt,
      maxRooms: 3,
      duration: params.duration,
    };

    this.instances.set(code, instance);
    this.bySubdomain.set(params.subdomain, code);
    console.log(`[InstanceManager] Created instance: ${code} (${params.subdomain})`);
    return instance;
  }

  getInstanceByCode(code: string): Instance | undefined {
    const instance = this.instances.get(code.toUpperCase());
    if (!instance) return undefined;
    // Prüfe ob abgelaufen
    if (instance.expiresAt && instance.expiresAt < Date.now()) {
      instance.active = false;
    }
    return instance;
  }

  getInstanceBySubdomain(subdomain: string): Instance | undefined {
    const code = this.bySubdomain.get(subdomain.toLowerCase());
    if (!code) return undefined;
    return this.getInstanceByCode(code);
  }

  getAllInstances(): Instance[] {
    return Array.from(this.instances.values());
  }
}
