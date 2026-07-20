import crypto from 'crypto';

export interface Instance {
  id: string;
  ownerEmail: string;
  code: string;          // 6-stellig — Haupt-Raum-Code (erster Raum)
  dashboardCode: string; // 4-stellig — Zugang zum Dashboard
  subdomain: string;
  eventName: string;
  questionSet: string;
  tier: 'custom';
  active: boolean;
  createdAt: number;
  expiresAt: number | null;
  maxRooms: number;
  duration: string;
  roomCodes: string[];   // Alle 4-stelligen Raum-Codes dieser Instanz
}

export class InstanceManager {
  private instances = new Map<string, Instance>();
  private bySubdomain = new Map<string, string>(); // subdomain → 6-digit code
  private byRoomCode = new Map<string, string>();  // 4-digit room code → 6-digit instance code

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

  private generateDashboardCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 100; attempt++) {
      const bytes = crypto.randomBytes(4);
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[bytes[i] % chars.length];
      }
      // Check uniqueness across all dashboard codes
      const exists = Array.from(this.instances.values()).some(i => i.dashboardCode === code);
      if (!exists) return code;
    }
    throw new Error('Could not generate unique dashboard code');
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
    const dashboardCode = this.generateDashboardCode();
    const instance: Instance = {
      id: crypto.randomUUID(),
      ownerEmail: params.email,
      code,
      dashboardCode,
      subdomain: params.subdomain,
      eventName: params.eventName,
      questionSet: params.questionSet || 'basic',
      tier: 'custom',
      active: true,
      createdAt: now,
      expiresAt,
      maxRooms: 3,
      duration: params.duration,
      roomCodes: [],
    };

    this.instances.set(code, instance);
    this.bySubdomain.set(params.subdomain, code);
    console.log(`[InstanceManager] Created instance: ${code} (dashboard: ${dashboardCode}) → ${params.subdomain}`);
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

  getInstanceByDashboardCode(dashboardCode: string): Instance | undefined {
    for (const instance of this.instances.values()) {
      if (instance.dashboardCode === dashboardCode.toUpperCase()) {
        if (instance.expiresAt && instance.expiresAt < Date.now()) {
          instance.active = false;
        }
        return instance;
      }
    }
    return undefined;
  }

  getInstanceByRoomCode(roomCode: string): Instance | undefined {
    const instanceCode = this.byRoomCode.get(roomCode.toUpperCase());
    if (!instanceCode) return undefined;
    return this.getInstanceByCode(instanceCode);
  }

  createRoomForInstance(dashboardCode: string, email: string): string | null {
    const instance = this.getInstanceByDashboardCode(dashboardCode);
    if (!instance || instance.ownerEmail.toLowerCase() !== email.toLowerCase() || !instance.active) {
      return null;
    }
    if (instance.roomCodes.length >= instance.maxRooms) {
      return null; // max rooms reached
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let attempt = 0; attempt < 100; attempt++) {
      const bytes = crypto.randomBytes(4);
      newCode = '';
      for (let i = 0; i < 4; i++) newCode += chars[bytes[i] % chars.length];
      // Check uniqueness against all room codes in ALL instances
      const exists = this.byRoomCode.has(newCode);
      if (!exists) break;
    }

    instance.roomCodes.push(newCode);
    this.byRoomCode.set(newCode, instance.code);
    console.log(`[InstanceManager] Created room ${newCode} for instance ${instance.code} (${instance.roomCodes.length}/${instance.maxRooms})`);
    return newCode;
  }

  getAllInstances(): Instance[] {
    return Array.from(this.instances.values());
  }
}
