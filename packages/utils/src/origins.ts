export function getTrustedOrigins(
  additionalOrigins: (string | undefined)[] = [],
  defaultOrigins: (string | undefined)[] = [],
) {
  return Array.from(
    new Set(
      [process.env.BASE_URL, ...defaultOrigins, ...additionalOrigins].filter(
        (origin): origin is string => typeof origin === "string",
      ),
    ),
  );
}
