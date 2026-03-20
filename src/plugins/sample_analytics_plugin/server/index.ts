/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/server';
import { SampleAnalyticsServerPlugin } from './plugin';

export { SampleAnalyticsServerSetup, SampleAnalyticsServerStart } from './types';
export { ServerTelemetryService } from './services';

export const plugin = (initContext: PluginInitializerContext) =>
  new SampleAnalyticsServerPlugin(initContext);
