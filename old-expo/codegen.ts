/**
 * GraphQL Code Generator Configuration
 * Generates TypeScript types from GraphQL schema
 * 
 * Usage:
 * 1. Run: pnpm run codegen
 * 
 * The schema is loaded from the local file: schema.graphql
 * This file contains the GraphQL schema exported from the Unraid API.
 * 
 * Generated files will be in: src/gql/
 * - Use the generated hooks and types for type-safe GraphQL queries
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Use the local schema file (GraphQL SDL format)
  schema: './schema.graphql',
  
  // Look for GraphQL queries in these files
  documents: ['src/**/*.{ts,tsx}'],
  
  // Generate types in this directory
  generates: {
    'src/gql/': {
      preset: 'client',
      plugins: [],
      config: {
        // Generate React hooks
        withHooks: true,
        // Make TypeScript strict
        strictScalars: true,
        // Use explicit types for scalars
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          Port: 'number',
          JSON: 'Record<string, any>',
          PrefixedID: 'string',
        },
      },
    },
  },
  
  // Ignore node_modules
  ignoreNoDocuments: true,
};

export default config;

