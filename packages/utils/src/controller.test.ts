import { describe, expect, test } from "bun:test";
import {
  ApiOperation,
  Controller,
  Get,
  Public,
  createOpenApiDocument,
} from "./controller.ts";

@Controller("/services")
class ServicesController {
  @Get("/:publicId")
  @ApiOperation({
    summary: "Get a service",
    description: "Returns a service and its associated target areas.",
    operationId: "services.get",
    tags: ["catalog"],
    deprecated: true,
  })
  get() {}

  @Get("/public")
  @Public()
  publicRoute() {}
}

describe("createOpenApiDocument", () => {
  test("includes ApiOperation metadata", () => {
    const document = createOpenApiDocument([ServicesController], {
      title: "Core API",
      securityScheme: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    });
    const operation = document.paths["/services/{publicId}"]?.get;

    expect(operation).toMatchObject({
      summary: "Get a service",
      description: "Returns a service and its associated target areas.",
      operationId: "services.get",
      tags: ["catalog"],
      deprecated: true,
      security: [{ apiKey: [] }],
    });
  });

  test("retains generated defaults and honors Public", () => {
    const document = createOpenApiDocument([ServicesController], {
      securityScheme: { type: "apiKey" },
    });
    const operation = document.paths["/services/public"]?.get;

    expect(operation).toMatchObject({
      operationId: "ServicesController.publicRoute",
      tags: ["services"],
    });
    expect(operation).not.toHaveProperty("security");
  });
});
