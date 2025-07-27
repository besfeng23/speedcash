export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: unknown; // Or use a proper Timestamp type
}

export interface ApiLog {
  id: string;
  organizationId: string;
  userId: string;
  timestamp: unknown; // Or a proper Timestamp type
  // ... other log fields
} 