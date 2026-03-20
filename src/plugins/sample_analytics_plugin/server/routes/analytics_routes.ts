/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { ServerTelemetryService } from '../services/server_telemetry_service';

/**
 * Registers sample API routes that demonstrate server-side telemetry patterns.
 * Each route shows a different tracking approach.
 */
export function registerAnalyticsRoutes(router: IRouter, telemetry: ServerTelemetryService) {
  // --- Example 1: Route with manual duration tracking -------------------------

  router.get(
    {
      path: '/api/sample_analytics/stats',
      validate: {
        query: schema.object({
          index: schema.string({ defaultValue: 'sample-data' }),
        }),
      },
    },
    async (context, request, response) => {
      const start = Date.now();
      const { index } = request.query;
      try {
        const client = context.core.opensearch.client.asCurrentUser;
        const result = await client.cat.indices({ index, format: 'json' });
        const durationMs = Date.now() - start;

        telemetry.trackRoute('/api/sample_analytics/stats', 'GET', 200, durationMs);
        telemetry.trackDbOperation('cat.indices', index, durationMs);

        return response.ok({ body: { data: result.body } });
      } catch (error) {
        const durationMs = Date.now() - start;
        telemetry.trackRoute('/api/sample_analytics/stats', 'GET', 500, durationMs);
        telemetry.trackError(error instanceof Error ? error : new Error(String(error)), {
          route: '/api/sample_analytics/stats',
          index,
        });
        return response.customError({
          statusCode: 500,
          body: { message: 'Failed to fetch stats' },
        });
      }
    }
  );

  // --- Example 2: Route using trackAsync for automatic tracking ---------------

  router.post(
    {
      path: '/api/sample_analytics/process',
      validate: {
        body: schema.object({
          items: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const { items } = request.body;
      try {
        const result = await telemetry.trackAsync(
          'process_items',
          async () => {
            // Simulate processing each item
            const processed = items.map((item) => ({
              id: item,
              status: 'processed',
              timestamp: new Date().toISOString(),
            }));
            return processed;
          },
          { itemCount: String(items.length) }
        );

        telemetry.trackRoute('/api/sample_analytics/process', 'POST', 200, 0);
        return response.ok({ body: { processed: result } });
      } catch (error) {
        telemetry.trackError(error instanceof Error ? error : new Error(String(error)), {
          route: '/api/sample_analytics/process',
        });
        return response.customError({
          statusCode: 500,
          body: { message: 'Processing failed' },
        });
      }
    }
  );

  // --- Example 3: Route demonstrating background job tracking -----------------

  router.post(
    {
      path: '/api/sample_analytics/run_job',
      validate: {
        body: schema.object({
          job_name: schema.string(),
          delay_ms: schema.number({ defaultValue: 1000, min: 0, max: 10000 }),
        }),
      },
    },
    async (_context, request, response) => {
      const { job_name: jobName, delay_ms: delayMs } = request.body;
      const start = Date.now();

      try {
        // Simulate a background job with configurable delay
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        const durationMs = Date.now() - start;
        telemetry.trackBackgroundJob(jobName, 'success', durationMs);
        telemetry.trackRoute('/api/sample_analytics/run_job', 'POST', 200, durationMs);

        return response.ok({
          body: { jobName, status: 'completed', durationMs },
        });
      } catch (error) {
        const durationMs = Date.now() - start;
        telemetry.trackBackgroundJob(jobName, 'failure', durationMs);
        telemetry.trackError(error instanceof Error ? error : new Error(String(error)), {
          route: '/api/sample_analytics/run_job',
          jobName,
        });
        return response.customError({
          statusCode: 500,
          body: { message: `Job "${jobName}" failed` },
        });
      }
    }
  );

  // --- Example 4: Route with HTTP forwarder (Option 2 telemetry) --------------

  router.post(
    {
      path: '/api/sample_analytics/track_event',
      validate: {
        body: schema.object({
          event_name: schema.string(),
          data: schema.recordOf(schema.string(), schema.any(), { defaultValue: {} }),
        }),
      },
    },
    async (context, request, response) => {
      const { event_name: eventName, data } = request.body;
      try {
        const client = context.core.opensearch.client.asInternalUser;
        await telemetry.forwardEvent(client, eventName, data);

        return response.ok({ body: { forwarded: true, eventName } });
      } catch (error) {
        telemetry.trackError(error instanceof Error ? error : new Error(String(error)), {
          route: '/api/sample_analytics/track_event',
          eventName,
        });
        return response.customError({
          statusCode: 500,
          body: { message: 'Failed to forward event' },
        });
      }
    }
  );
}
