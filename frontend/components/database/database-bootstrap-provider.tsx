import { Suspense } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import type { ReactNode } from "react";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

import { initializeDatabase } from "@/db/api/database/database-api";
import { APP_DATABASE_NAME } from "@/db/constants/database";

import { DatabaseBootstrapErrorBoundary } from "@/components/database/database-bootstrap-error-boundary";
import { DatabaseBootstrapFallback } from "@/components/database/database-bootstrap-fallback";

function DrizzleStudioConnection() {
  const db = useSQLiteContext();
  useDrizzleStudio(db);
  return null; // no UI
}

type DatabaseBootstrapProviderProps = {
  children: ReactNode;
};

export function DatabaseBootstrapProvider({
  children,
}: DatabaseBootstrapProviderProps) {
  return (
    <DatabaseBootstrapErrorBoundary>
      <Suspense fallback={<DatabaseBootstrapFallback />}>
        <SQLiteProvider
          databaseName={APP_DATABASE_NAME}
          onInit={initializeDatabase}
          useSuspense
        >
          {__DEV__ && <DrizzleStudioConnection />}
          {children}
        </SQLiteProvider>
      </Suspense>
    </DatabaseBootstrapErrorBoundary>
  );
}
