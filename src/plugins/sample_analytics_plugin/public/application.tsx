/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { SampleApp } from './components/sample_app';
import { TelemetryProvider } from './components/telemetry_context';
import { AnalyticsTelemetryService } from './services/telemetry_service';

export const renderApp = (telemetryService: AnalyticsTelemetryService, element: HTMLElement) => {
  ReactDOM.render(
    <TelemetryProvider service={telemetryService}>
      <SampleApp />
    </TelemetryProvider>,
    element
  );
  return () => ReactDOM.unmountComponentAtNode(element);
};
