/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServerTelemetryService } from './services/server_telemetry_service';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SampleAnalyticsServerSetup {}

export interface SampleAnalyticsServerStart {
  telemetry: ServerTelemetryService;
}
