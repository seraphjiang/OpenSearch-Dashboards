/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginTelemetryRecorder, TelemetryServiceStart } from 'opensearch-dashboards/public';
import { TELEMETRY_EVENTS, TELEMETRY_METRICS } from '../../common';
import { WorkflowTracker } from './workflow_tracker';

/**
 * Reusable telemetry service wrapper that provides high-level tracking methods.
 *
 * Wraps the core PluginTelemetryRecorder with domain-specific helpers so
 * components don't need to know event schema details. Copy and adapt this
 * pattern for your own plugin.
 */
export class AnalyticsTelemetryService {
  private recorder: PluginTelemetryRecorder;
  private enabled: boolean;

  constructor(telemetry: TelemetryServiceStart) {
    this.recorder = telemetry.getPluginRecorder();
    this.enabled = telemetry.isEnabled();
  }

  // -- User action tracking --------------------------------------------------

  trackButtonClick(buttonId: string, context?: Record<string, string>) {
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.BUTTON_CLICKED,
      data: { buttonId, ...context },
    });
  }

  trackFormSubmission(formId: string, fieldCount: number) {
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.FORM_SUBMITTED,
      data: { formId, fieldCount },
    });
  }

  trackTabChange(tabId: string, previousTabId?: string) {
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.TAB_CHANGED,
      data: { tabId, previousTabId },
    });
  }

  // -- Performance tracking --------------------------------------------------

  trackPageLoad(page: string, durationMs: number) {
    this.recorder.recordMetric({
      name: TELEMETRY_METRICS.PAGE_LOAD_TIME,
      value: durationMs,
      unit: 'ms',
      labels: { page },
    });
  }

  trackApiCall(endpoint: string, durationMs: number, status: string) {
    this.recorder.recordMetric({
      name: TELEMETRY_METRICS.API_RESPONSE_TIME,
      value: durationMs,
      unit: 'ms',
      labels: { endpoint, status },
    });

    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.API_CALL,
      data: { endpoint, durationMs, status },
    });
  }

  trackRenderTime(component: string, durationMs: number) {
    this.recorder.recordMetric({
      name: TELEMETRY_METRICS.RENDER_TIME,
      value: durationMs,
      unit: 'ms',
      labels: { component },
    });
  }

  // -- Error tracking --------------------------------------------------------

  trackError(type: string, message: string, context?: Record<string, any>) {
    this.recorder.recordError({ type, message, context });
  }

  trackCaughtError(error: Error, context?: Record<string, any>) {
    this.recorder.recordError({
      type: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  // -- Workflow tracking -----------------------------------------------------

  /**
   * Start a multi-step workflow. Returns a WorkflowTracker that records
   * step completions and final outcome.
   */
  startWorkflow(workflowId: string, metadata?: Record<string, any>): WorkflowTracker {
    return new WorkflowTracker(this.recorder, workflowId, metadata);
  }

  // -- Utilities -------------------------------------------------------------

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Wrap an async function and automatically record its duration and any errors.
   * Useful for tracking API calls or expensive computations.
   */
  async trackAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recorder.recordMetric({
        name: `${operationName}_duration_ms`,
        value: duration,
        unit: 'ms',
        labels,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recorder.recordMetric({
        name: `${operationName}_duration_ms`,
        value: duration,
        unit: 'ms',
        labels: { ...labels, status: 'error' },
      });
      this.trackCaughtError(error instanceof Error ? error : new Error(String(error)), {
        operation: operationName,
        ...labels,
      });
      throw error;
    }
  }
}
