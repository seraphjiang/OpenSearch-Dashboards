/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin, CoreSetup, CoreStart, AppMountParameters } from 'opensearch-dashboards/public';
import { SampleAnalyticsPluginSetup, SampleAnalyticsPluginStart } from './types';
import { AnalyticsTelemetryService } from './services/telemetry_service';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';

export class SampleAnalyticsPlugin
  implements Plugin<SampleAnalyticsPluginSetup, SampleAnalyticsPluginStart> {
  private telemetryService?: AnalyticsTelemetryService;

  public setup(core: CoreSetup): SampleAnalyticsPluginSetup {
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        const [coreStart] = await core.getStartServices();
        const service = new AnalyticsTelemetryService(coreStart.telemetry);
        const { renderApp } = await import('./application');
        return renderApp(service, params.element);
      },
    });

    return {};
  }

  public start(core: CoreStart): SampleAnalyticsPluginStart {
    this.telemetryService = new AnalyticsTelemetryService(core.telemetry);
    return {
      telemetry: this.telemetryService,
    };
  }

  public stop() {}
}
