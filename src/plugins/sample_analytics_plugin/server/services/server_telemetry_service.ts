/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';

/**
 * Server-side telemetry service demonstrating three approaches:
 *
 * Option 1 (Recommended): Structured logging via Logger
 *   - All telemetry is emitted as structured log lines
 *   - Easy to consume by log aggregators (CloudWatch, Datadog, ELK)
 *   - Zero external dependencies
 *
 * Option 2: HTTP forwarder to existing telemetry pipeline
 *   - Forwards events to the client-side telemetry endpoint
 *   - Reuses the browser telemetry infrastructure
 *
 * Option 3: Direct backend integration (e.g., Kinesis)
 *   - Send events directly to a streaming backend
 *   - Commented out by default — uncomment and configure for production
 */
export class ServerTelemetryService {
  constructor(private readonly logger: Logger) {}

  // ---------------------------------------------------------------------------
  // Option 1: Structured Logging (Recommended)
  // ---------------------------------------------------------------------------

  /**
   * Track an API route call with duration and outcome.
   * Emits a structured log line parseable by log aggregators.
   */
  trackRoute(route: string, method: string, statusCode: number, durationMs: number) {
    this.logger.info('telemetry.route', {
      event: 'api_route',
      route,
      method,
      statusCode,
      durationMs,
      success: statusCode < 400,
    } as any);
  }

  /**
   * Track a background job execution.
   */
  trackBackgroundJob(jobName: string, outcome: 'success' | 'failure', durationMs: number) {
    const level = outcome === 'success' ? 'info' : 'error';
    this.logger[level]('telemetry.background_job', {
      event: 'background_job',
      jobName,
      outcome,
      durationMs,
    } as any);
  }

  /**
   * Track a database/OpenSearch operation.
   */
  trackDbOperation(operation: string, index: string, durationMs: number, docCount?: number) {
    this.logger.info('telemetry.db_operation', {
      event: 'db_operation',
      operation,
      index,
      durationMs,
      docCount,
    } as any);
  }

  /**
   * Track a server-side error with context.
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.logger.error('telemetry.error', {
      event: 'server_error',
      errorType: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    } as any);
  }

  // ---------------------------------------------------------------------------
  // Option 2: HTTP Forwarder — forward events to existing telemetry pipeline
  // ---------------------------------------------------------------------------

  /**
   * Forward a telemetry event to the browser telemetry endpoint.
   * Useful when you want server events in the same pipeline as client events.
   *
   * Usage: call from a route handler where you have access to `context`.
   *
   * @example
   * ```typescript
   * // In a route handler:
   * const client = context.core.opensearch.client.asInternalUser;
   * await serverTelemetry.forwardEvent(client, 'server_action', { key: 'value' });
   * ```
   */
  async forwardEvent(
    opensearchClient: { index: (params: any) => Promise<any> },
    eventName: string,
    data: Record<string, any>
  ) {
    try {
      await opensearchClient.index({
        index: '.opensearch-dashboards-telemetry',
        body: {
          event: eventName,
          timestamp: new Date().toISOString(),
          source: 'sampleAnalytics',
          ...data,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to forward telemetry event "${eventName}": ${e}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Option 3: Direct Backend (e.g., Kinesis) — uncomment to use
  // ---------------------------------------------------------------------------

  // private kinesisClient?: AWS.Kinesis;
  // private streamName?: string;
  //
  // initKinesis(config: { region: string; streamName: string }) {
  //   const AWS = require('aws-sdk');
  //   this.kinesisClient = new AWS.Kinesis({ region: config.region });
  //   this.streamName = config.streamName;
  // }
  //
  // async sendToKinesis(eventName: string, data: Record<string, any>) {
  //   if (!this.kinesisClient || !this.streamName) return;
  //   try {
  //     await this.kinesisClient.putRecord({
  //       StreamName: this.streamName,
  //       PartitionKey: eventName,
  //       Data: JSON.stringify({
  //         event: eventName,
  //         timestamp: new Date().toISOString(),
  //         source: 'sampleAnalytics',
  //         ...data,
  //       }),
  //     }).promise();
  //   } catch (e) {
  //     this.logger.warn(`Failed to send Kinesis event "${eventName}": ${e}`);
  //   }
  // }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Wrap an async function and automatically track its duration and errors.
   * Works the same as the client-side trackAsync but uses structured logging.
   */
  async trackAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    meta?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      this.logger.info('telemetry.operation', {
        event: 'async_operation',
        operation: operationName,
        durationMs,
        outcome: 'success',
        ...meta,
      } as any);
      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      this.logger.error('telemetry.operation', {
        event: 'async_operation',
        operation: operationName,
        durationMs,
        outcome: 'failure',
        errorMessage: error instanceof Error ? error.message : String(error),
        ...meta,
      } as any);
      throw error;
    }
  }
}
