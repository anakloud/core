// Stub for React Native / browser environments
// These exports exist only to satisfy imports — using them throws at runtime

const notAvailable = (name: string) => {
  throw new Error(`${name} is not available in this environment`);
};

export const mongoClient = new Proxy({} as any, {
  get() {
    notAvailable("mongoClient");
  },
});

export const database = new Proxy({} as any, {
  get() {
    notAvailable("database");
  },
});

export async function connectDatabase(): Promise<never> {
  notAvailable("connectDatabase");
}

export async function closeDatabase(): Promise<never> {
  notAvailable("closeDatabase");
}
