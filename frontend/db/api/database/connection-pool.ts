import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import {
  APP_DATABASE_NAME,
  PROJECTS_DATABASE_POOL_SIZE,
} from '@/db/constants/database';

type PoolSlot = {
  db: SQLiteDatabase;
  inUse: boolean;
};

type SlotResolver = (slotIndex: number) => void;

const DATABASE_OPEN_OPTIONS = {
  useNewConnection: true,
  finalizeUnusedStatementsBeforeClosing: true,
};

const DATABASE_CONNECTION_PRAGMAS = `
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`;

function logPoolError(context: string, error: unknown): void {
  console.error(`[DB Pool] ${context}`, error);
}

class DatabaseConnectionPool {
  private readonly slots: PoolSlot[] = [];
  private readonly waitQueue: SlotResolver[] = [];

  async withConnection<T>(
    operation: (db: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const slotIndex = await this.acquireSlot();

    try {
      return await operation(this.slots[slotIndex].db);
    } finally {
      if (!this.isSlotHealthy(slotIndex)) {
        try {
          this.resetSlot(slotIndex);
        } catch (error) {
          logPoolError(`Failed to reset unhealthy slot ${slotIndex}`, error);
        }
      }

      this.releaseSlot(slotIndex);
    }
  }

  private async acquireSlot(): Promise<number> {
    const availableIndex = this.slots.findIndex((slot) => !slot.inUse);
    if (availableIndex !== -1) {
      this.slots[availableIndex].inUse = true;
      return availableIndex;
    }

    if (this.slots.length < PROJECTS_DATABASE_POOL_SIZE) {
      const newSlotIndex = this.createSlot();
      this.slots[newSlotIndex].inUse = true;
      return newSlotIndex;
    }

    return new Promise<number>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  private releaseSlot(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (!slot) {
      return;
    }

    const nextResolver = this.waitQueue.shift();
    if (nextResolver) {
      // Keep this slot reserved and hand it directly to the next waiter.
      nextResolver(slotIndex);
      return;
    }

    slot.inUse = false;
  }

  private createSlot(): number {
    const db = this.openConfiguredDatabase();
    this.slots.push({ db, inUse: false });
    return this.slots.length - 1;
  }

  private isSlotHealthy(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot) {
      return false;
    }

    try {
      slot.db.getFirstSync('SELECT 1;');
      return true;
    } catch (error) {
      logPoolError(`Slot ${slotIndex} failed health check`, error);
      return false;
    }
  }

  private resetSlot(slotIndex: number): void {
    const existingSlot = this.slots[slotIndex];
    if (!existingSlot) {
      return;
    }

    try {
      existingSlot.db.closeSync();
    } catch (error) {
      logPoolError(`Failed to close slot ${slotIndex} during reset`, error);
    }

    const replacementDb = this.openConfiguredDatabase();
    this.slots[slotIndex] = {
      db: replacementDb,
      inUse: true,
    };
  }

  private openConfiguredDatabase(): SQLiteDatabase {
    const db = openDatabaseSync(APP_DATABASE_NAME, DATABASE_OPEN_OPTIONS);
    db.execSync(DATABASE_CONNECTION_PRAGMAS);
    return db;
  }
}

const globalPool = globalThis as typeof globalThis & {
  __projectsDatabasePool?: DatabaseConnectionPool;
};

const projectsDatabasePool =
  globalPool.__projectsDatabasePool ?? new DatabaseConnectionPool();

if (!globalPool.__projectsDatabasePool) {
  globalPool.__projectsDatabasePool = projectsDatabasePool;
}

export async function withProjectsDatabase<T>(
  operation: (db: SQLiteDatabase) => Promise<T>
): Promise<T> {
  return projectsDatabasePool.withConnection(operation);
}
