// Patch Bun's missing node:v8 getBuiltinModule / isBuildingSnapshot compatibility for bson/mongodb
if (typeof globalThis !== "undefined" && (globalThis as any).process) {
  const originalGetBuiltinModule = (globalThis as any).process.getBuiltinModule;
  (globalThis as any).process.getBuiltinModule = function (name: string) {
    if (name === "v8") {
      return {
        startupSnapshot: {
          isBuildingSnapshot: () => false,
        },
      };
    }
    return originalGetBuiltinModule ? originalGetBuiltinModule.call(this, name) : undefined;
  };
}
