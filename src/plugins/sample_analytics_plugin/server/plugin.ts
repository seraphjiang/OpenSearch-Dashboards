/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Plugin,
  CoreSetup,
  CoreStart,
  PluginInitializerContext,
  Logger,
} from 'opensearch-dashboards/server';
import { SampleAnalyticsServerSetup, SampleAnalyticsServerStart } from './types';
import { ServerTelemetryService } from './services/server_telemetry_service';
import { registerAnalyticsRoutes } from './routes';

export class SampleAnalyticsServerPlugin
  implements Plugin<SampleAnalyticsServerSetup, SampleAnalyticsServerStart> {
  private readonly logger: Logger;
  private telemetryService?: ServerTelemetryService;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup): SampleAnalyticsServerSetup {
    this.logger.debug('Setting up SampleAnalyticsServerPlugin');

    this.telemetryService = new ServerTelemetryService(this.logger);

    const router = core.http.createRouter();
    registerAnalyticsRoutes(router, this.telemetryService);

    return {};
  }

  public start(_core: CoreStart): SampleAnalyticsServerStart {
    return {
      telemetry: this.telemetryService!,
    };
  }

  public stop() {}
}
