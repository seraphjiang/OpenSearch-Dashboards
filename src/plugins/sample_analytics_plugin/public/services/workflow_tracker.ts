/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginTelemetryRecorder } from 'opensearch-dashboards/public';
import { TELEMETRY_EVENTS, TELEMETRY_METRICS } from '../../common';

/**
 * Tracks a multi-step workflow from start to completion or abandonment.
 * Records individual step completions and overall workflow duration.
 */
export class WorkflowTracker {
  private readonly startTime: number;
  private stepIndex = 0;

  constructor(
    private readonly recorder: PluginTelemetryRecorder,
    private readonly workflowId: string,
    metadata?: Record<string, any>
  ) {
    this.startTime = performance.now();
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.WORKFLOW_STARTED,
      data: { workflowId, ...metadata },
    });
  }

  completeStep(stepName: string, data?: Record<string, any>) {
    this.stepIndex++;
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.WORKFLOW_STEP_COMPLETED,
      data: {
        workflowId: this.workflowId,
        stepName,
        stepIndex: this.stepIndex,
        ...data,
      },
    });
  }

  complete(data?: Record<string, any>) {
    const duration = performance.now() - this.startTime;
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.WORKFLOW_COMPLETED,
      data: {
        workflowId: this.workflowId,
        totalSteps: this.stepIndex,
        ...data,
      },
    });
    this.recorder.recordMetric({
      name: TELEMETRY_METRICS.WORKFLOW_DURATION,
      value: duration,
      unit: 'ms',
      labels: { workflowId: this.workflowId, outcome: 'completed' },
    });
  }

  abandon(reason?: string) {
    const duration = performance.now() - this.startTime;
    this.recorder.recordEvent({
      name: TELEMETRY_EVENTS.WORKFLOW_ABANDONED,
      data: {
        workflowId: this.workflowId,
        lastStep: this.stepIndex,
        reason,
      },
    });
    this.recorder.recordMetric({
      name: TELEMETRY_METRICS.WORKFLOW_DURATION,
      value: duration,
      unit: 'ms',
      labels: { workflowId: this.workflowId, outcome: 'abandoned' },
    });
  }
}
