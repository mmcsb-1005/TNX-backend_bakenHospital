import prisma from "../../lib/prisma"; // Adjust path as necessary
import { MailType, SendTrigger } from "@prisma/client";

// Export the Prisma client for the Mail model
export const Mail = prisma.mail;

// --- Interfaces for Request/DPO (Data Parameter Object) ---

// Interface for creating a new Mail template
export interface CreateMailDto {
    name: string;
    subject: string;
    body: string;
    mailType: MailType;
    sendTrigger: SendTrigger;
    daysOffset?: number | null; // Optional for manual triggers
    templateVariables?: Record<string, any> | null; // Json type handled as object
    isActive?: boolean;
}

// Interface for updating an existing Mail template
export interface UpdateMailDto {
    name?: string;
    subject?: string;
    body?: string;
    mailType?: MailType;
    sendTrigger?: SendTrigger;
    daysOffset?: number | null;
    templateVariables?: Record<string, any> | null;
    isActive?: boolean;
}

// Interface for the data retrieved from the database
export interface MailRecord {
    id: string;
    name: string;
    subject: string;
    body: string;
    mailType: MailType;
    sendTrigger: SendTrigger;
    daysOffset: number | null;
    templateVariables: Record<string, any> | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}