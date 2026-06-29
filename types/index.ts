export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Conversion {
  id: string;
  userId: string;
  type: "optimize" | "nl2sql" | "schema" | "playground" | "example";
  input: string;
  output?: string | null;
  dialect?: string | null;
  domain?: string | null;
  issueCount: number;
  severity?: string | null;
  status: string;
  modelUsed?: string | null;
  duration?: number | null;
  metadata?: string | null;
  createdAt: Date;
}

export interface SchemaVault {
  id: string;
  userId: string;
  name: string;
  ddl: string;
  tableCount: number;
  colCount: number;
  relCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Severity = "critical" | "high" | "medium" | "low";
export type SQLDialect = "PostgreSQL" | "MySQL" | "SQLite" | "BigQuery" | "MS SQL Server";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
