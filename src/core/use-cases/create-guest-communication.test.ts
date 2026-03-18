/**
 * CreateGuestCommunication UseCase Tests
 */

import { CreateGuestCommunicationUseCase } from './create-guest-communication';
import { CommunicationRepositoryImpl } from '@/infrastructure/database/repositories/communication-repository';
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository';

// Mock repositories
const mockCommunicationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByGuestId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as CommunicationRepositoryImpl;

const mockGuestRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
} as unknown as GuestRepositoryImpl;

describe('CreateGuestCommunicationUseCase', () => {
  let useCase: CreateGuestCommunicationUseCase;

  beforeEach(() => {
    useCase = new CreateGuestCommunicationUseCase(
      mockCommunicationRepository,
      mockGuestRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      guestId: 'guest-123',
      propertyId: 'property-456',
      type: 'email',
      subject: 'Welcome to our property',
      content: 'Thank you for your booking!',
      channel: 'email',
      status: 'pending',
    };

    it('should create guest communication when data is valid', async () => {
      // Arrange
      const mockGuest = {
        id: 'guest-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockCommunication = {
        id: 'comm-789',
        ...validInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockCommunicationRepository.create.mockResolvedValue(mockCommunication);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('comm-789');
      expect(mockGuestRepository.findById).toHaveBeenCalledWith('guest-123');
      expect(mockCommunicationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(validInput)
      );
    });

    it('should fail when guest does not exist', async () => {
      // Arrange
      mockGuestRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Guest not found');
      expect(mockCommunicationRepository.create).not.toHaveBeenCalled();
    });

    it('should fail when guest ID is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, guestId: undefined };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('guestId');
    });

    it('should fail when property ID is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, propertyId: undefined };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('propertyId');
    });

    it('should fail when communication type is invalid', async () => {
      // Arrange
      const invalidInput = { 
        ...validInput, 
        type: 'invalid-type' as any 
      };

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockGuest = {
        id: 'guest-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockCommunicationRepository.create.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create communication');
    });

    it('should create WhatsApp communication', async () => {
      // Arrange
      const whatsappInput = {
        ...validInput,
        type: 'whatsapp' as const,
        channel: 'whatsapp' as const,
      };

      const mockGuest = {
        id: 'guest-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+38640123456',
      };

      const mockCommunication = {
        id: 'comm-789',
        ...whatsappInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockCommunicationRepository.create.mockResolvedValue(mockCommunication);

      // Act
      const result = await useCase.execute(whatsappInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('whatsapp');
    });

    it('should create email communication', async () => {
      // Arrange
      const emailInput = {
        ...validInput,
        type: 'email' as const,
        channel: 'email' as const,
      };

      const mockGuest = {
        id: 'guest-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockCommunication = {
        id: 'comm-789',
        ...emailInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockCommunicationRepository.create.mockResolvedValue(mockCommunication);

      // Act
      const result = await useCase.execute(emailInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('email');
    });

    it('should handle scheduled communications', async () => {
      // Arrange
      const scheduledInput = {
        ...validInput,
        scheduledAt: new Date(Date.now() + 86400000), // 1 day in future
        status: 'scheduled',
      };

      const mockGuest = {
        id: 'guest-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockCommunication = {
        id: 'comm-789',
        ...scheduledInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockCommunicationRepository.create.mockResolvedValue(mockCommunication);

      // Act
      const result = await useCase.execute(scheduledInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('scheduled');
    });
  });
});
