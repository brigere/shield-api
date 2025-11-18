import { routingControllersToSpec } from 'routing-controllers-openapi';
import { getMetadataArgsStorage } from 'routing-controllers';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

export function generateSwaggerSpec() {
  // Get routing-controllers metadata
  const storage = getMetadataArgsStorage();

  // Convert class-validator metadata to JSON schema
  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  });

  // Generate OpenAPI spec
  const spec = routingControllersToSpec(
    storage,
    {},
    {
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [], // References the scheme defined above. The empty array is required for OpenAPI specification.
        },
      ],
      info: {
        title: 'Shield API',
        description: 'API documentation for Shield application',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
      ],
    },
  );

  return spec;
}
