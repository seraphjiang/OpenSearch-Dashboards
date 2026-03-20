/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalyticsTelemetryService } from './services/telemetry_service';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SampleAnalyticsPluginSetup {}

export interface SampleAnalyticsPluginStart {
  telemetry: AnalyticsTelemetryService;
}
