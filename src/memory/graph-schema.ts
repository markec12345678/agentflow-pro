/**
 * AgentFlow Pro - Knowledge Graph Schema
 * Entity and relation types for Memory MCP
 */

export const ENTITY_TYPES = [
  "Agent",
  "Workflow",
  "Task",
  "User",
  "Deploy",
  "Property",
  "Guest",
  "Reservation",
  "Amenity",
  "Policy",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const RELATION_TYPES = [
  "executes",
  "owns",
  "triggers",
  "partOf",
  "hasGuest",
  "hasReservation",
  "locatedAt",
  "belongsTo",
  "hasAmenity",
  "hasPolicy",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface Entity {
  name: string;
  entityType: EntityType;
  observations: string[];
}

export interface Relation {
  from: string;
  to: string;
  relationType: RelationType;
}

export interface GraphNode {
  name: string;
  entityType: string;
  observations: string[];
}

export interface GraphRelation {
  from: string;
  to: string;
  relationType: string;
}

export interface GraphSnapshot {
  entities: GraphNode[];
  relations: GraphRelation[];
}
