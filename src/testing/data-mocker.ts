/**
 * AgentFlow Pro - Production Data Mocking
 * Generate realistic mock data for testing
 */

export interface MockDataConfig {
  entityType: 'user' | 'reservation' | 'property' | 'workflow' | 'agent';
  count: number;
  locale?: 'sl' | 'en' | 'de' | 'it';
  includeRelations?: boolean;
  seed?: number;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: string;
}

export interface MockReservation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  channel: 'direct' | 'booking.com' | 'airbnb';
}

export interface MockProperty {
  id: string;
  name: string;
  type: 'hotel' | 'apartment' | 'house' | 'camp';
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  roomCount: number;
  amenities: string[];
}

export class DataMocker {
  private readonly slovenianCities = [
    'Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje',
    'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik'
  ];

  private readonly slovenianStreets = [
    'Slovenska cesta', 'Dunajska cesta', 'Celovška cesta',
    'Tržaška cesta', 'Zaloška cesta', 'Šmartinska cesta'
  ];

  private readonly hotelNames = [
    'Hotel Lev', 'Grand Hotel Union', 'Hotel Slonik',
    'City Hotel', 'Boutique Hotel', 'Hotel Park'
  ];

  /**
   * Generate mock users
   */
  generateUsers(count: number, options?: { locale?: string; includeAdmin?: boolean }): MockUser[] {
    const users: MockUser[] = [];
    const roles: Array<MockUser['role']> = ['ADMIN', 'EDITOR', 'VIEWER'];

    for (let i = 0; i < count; i++) {
      const firstName = this.generateFirstName(options?.locale || 'sl');
      const lastName = this.generateLastName(options?.locale || 'sl');
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

      users.push({
        id: `user_${Date.now()}_${i}`,
        email,
        name: `${firstName} ${lastName}`,
        role: (i === 0 && options?.includeAdmin) ? 'ADMIN' : roles[Math.floor(Math.random() * roles.length)],
        createdAt: this.randomDateInRange(365, 0).toISOString(),
      });
    }

    return users;
  }

  /**
   * Generate mock reservations
   */
  generateReservations(
    count: number,
    propertyIds: string[],
    options?: { locale?: string }
  ): MockReservation[] {
    const reservations: MockReservation[] = [];
    const statuses: Array<MockReservation['status']> = ['confirmed', 'pending', 'cancelled', 'completed'];
    const channels: Array<MockReservation['channel']> = ['direct', 'booking.com', 'airbnb'];

    for (let i = 0; i < count; i++) {
      const checkIn = this.randomDateInRange(90, -30);
      const nights = Math.floor(Math.random() * 7) + 1;
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);

      const guests = Math.floor(Math.random() * 4) + 1;
      const basePrice = 80 + Math.floor(Math.random() * 120);
      const totalPrice = basePrice * nights;

      reservations.push({
        id: `res_${Date.now()}_${i}`,
        propertyId: propertyIds[Math.floor(Math.random() * propertyIds.length)],
        guestName: `${this.generateFirstName(options?.locale || 'sl')} ${this.generateLastName(options?.locale || 'sl')}`,
        guestEmail: `guest${i}@example.com`,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
        totalPrice: Math.round(totalPrice * 100) / 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
      });
    }

    return reservations;
  }

  /**
   * Generate mock properties
   */
  generateProperties(count: number, options?: { locale?: string }): MockProperty[] {
    const properties: MockProperty[] = [];
    const types: Array<MockProperty['type']> = ['hotel', 'apartment', 'house', 'camp'];
    const amenitiesList = [
      ['WiFi', 'Parking', 'Breakfast'],
      ['WiFi', 'Pool', 'Spa', 'Gym'],
      ['WiFi', 'Kitchen', 'Washer', 'Dryer'],
      ['WiFi', 'Parking', 'BBQ', 'Garden'],
    ];

    for (let i = 0; i < count; i++) {
      const city = this.slovenianCities[Math.floor(Math.random() * this.slovenianCities.length)];
      const street = this.slovenianStreets[Math.floor(Math.random() * this.slovenianStreets.length)];
      const streetNumber = Math.floor(Math.random() * 100) + 1;

      properties.push({
        id: `prop_${Date.now()}_${i}`,
        name: options?.locale === 'sl'
          ? `${this.hotelNames[Math.floor(Math.random() * this.hotelNames.length)]} ${city}`
          : `${city} ${this.hotelNames[Math.floor(Math.random() * this.hotelNames.length)]}`,
        type: types[Math.floor(Math.random() * types.length)],
        address: {
          street: `${street} ${streetNumber}`,
          city,
          postalCode: `${Math.floor(Math.random() * 9000) + 1000}`,
          country: 'Slovenia',
        },
        roomCount: Math.floor(Math.random() * 50) + 5,
        amenities: amenitiesList[Math.floor(Math.random() * amenitiesList.length)],
      });
    }

    return properties;
  }

  /**
   * Generate mock workflows
   */
  generateWorkflows(count: number, agentIds: string[]): any[] {
    const workflows = [];

    for (let i = 0; i < count; i++) {
      workflows.push({
        id: `workflow_${Date.now()}_${i}`,
        name: `Workflow ${i + 1}`,
        description: `Test workflow ${i + 1}`,
        agents: this.shuffleArray(agentIds).slice(0, Math.floor(Math.random() * 3) + 1),
        status: ['active', 'inactive', 'draft'][Math.floor(Math.random() * 3)],
        createdAt: this.randomDateInRange(365, 0).toISOString(),
        executions: Math.floor(Math.random() * 1000),
        successRate: 0.7 + (Math.random() * 0.3),
      });
    }

    return workflows;
  }

  /**
   * Generate complete test dataset
   */
  generateCompleteDataset(options?: {
    userCount?: number;
    propertyCount?: number;
    reservationCount?: number;
    workflowCount?: number;
    locale?: string;
  }): {
    users: MockUser[];
    properties: MockProperty[];
    reservations: MockReservation[];
    workflows: any[];
  } {
    const userCount = options?.userCount || 10;
    const propertyCount = options?.propertyCount || 5;
    const reservationCount = options?.reservationCount || 50;
    const workflowCount = options?.workflowCount || 3;

    const users = this.generateUsers(userCount, { locale: options?.locale, includeAdmin: true });
    const properties = this.generateProperties(propertyCount, { locale: options?.locale });
    const propertyIds = properties.map(p => p.id);
    const reservations = this.generateReservations(reservationCount, propertyIds, { locale: options?.locale });
    const workflows = this.generateWorkflows(workflowCount, ['agent-1', 'agent-2', 'agent-3']);

    return { users, properties, reservations, workflows };
  }

  /**
   * Anonymize production data for testing
   */
  anonymizeData<T extends Record<string, any>>(data: T[], fields: Array<keyof T>): T[] {
    return data.map(item => {
      const anonymized = { ...item };
      
      fields.forEach(field => {
        const value = item[field];
        if (typeof value === 'string') {
          if (field === 'email' || String(value).includes('@')) {
            anonymized[field] = `user_${Math.random().toString(36).substring(7)}@example.com` as any;
          } else if (field === 'name' || String(value).match(/^[A-ZČŠŽ][a-zčšž]+$/)) {
            anonymized[field] = this.generateFirstName('sl') as any;
          }
        }
      });

      return anonymized;
    });
  }

  // Helper methods

  private generateFirstName(locale: string): string {
    const slMale = ['Luka', 'Marko', 'Peter', 'Jan', 'Matej', 'David', 'Nik', 'Tilen', 'Enej', 'Vid'];
    const slFemale = ['Maja', 'Nina', 'Ana', 'Eva', 'Sara', 'Lara', 'Zala', 'Pia', 'Nika', 'Ema'];
    const enMale = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph'];
    const enFemale = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica'];

    const isMale = Math.random() > 0.5;
    
    if (locale === 'sl') {
      return isMale ? 
        slMale[Math.floor(Math.random() * slMale.length)] :
        slFemale[Math.floor(Math.random() * slFemale.length)];
    }
    
    return isMale ?
      enMale[Math.floor(Math.random() * enMale.length)] :
      enFemale[Math.floor(Math.random() * enFemale.length)];
  }

  private generateLastName(locale: string): string {
    const slLastNames = ['Novak', 'Horvat', 'Kovač', 'Zupan', 'Krajnc', 'Breznik', 'Gorenc', 'Dolinar'];
    const enLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

    return locale === 'sl' ?
      slLastNames[Math.floor(Math.random() * slLastNames.length)] :
      enLastNames[Math.floor(Math.random() * enLastNames.length)];
  }

  private randomDateInRange(daysForward: number, daysBack: number): Date {
    const now = Date.now();
    const min = now - (daysBack * 24 * 60 * 60 * 1000);
    const max = now + (daysForward * 24 * 60 * 60 * 1000);
    return new Date(min + Math.random() * (max - min));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const dataMocker = new DataMocker();
