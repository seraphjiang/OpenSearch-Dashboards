/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'sampleAnalytics';
export const PLUGIN_NAME = 'Sample Analytics';

// Telemetry event name constants — centralize to avoid typos
export const TELEMETRY_EVENTS = {
  // User actions
  BUTTON_CLICKED: 'button_clicked',
  FORM_SUBMITTED: 'form_submitted',
  TAB_CHANGED: 'tab_changed',

  // Performance
  PAGE_LOAD: 'page_load',
  API_CALL: 'api_call',

  // Workflow tracking
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_STEP_COMPLETED: 'workflow_step_completed',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_ABANDONED: 'workflow_abandoned',
} as const;

export const TELEMETRY_METRICS = {
  PAGE_LOAD_TIME: 'page_load_time_ms',
  API_RESPONSE_TIME: 'api_response_time_ms',
  RENDER_TIME: 'render_time_ms',
  WORKFLOW_DURATION: 'workflow_duration_ms',
} as const;
