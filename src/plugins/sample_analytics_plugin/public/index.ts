/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializer } from 'opensearch-dashboards/public';
import { SampleAnalyticsPlugin } from './plugin';
import { SampleAnalyticsPluginSetup, SampleAnalyticsPluginStart } from './types';

export const plugin: PluginInitializer<
  SampleAnalyticsPluginSetup,
  SampleAnalyticsPluginStart
> = () => new SampleAnalyticsPlugin();

export { SampleAnalyticsPluginSetup, SampleAnalyticsPluginStart } from './types';
export { AnalyticsTelemetryService, WorkflowTracker } from './services';
export { useTelemetry, TelemetryProvider } from './components';
