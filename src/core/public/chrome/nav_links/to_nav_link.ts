/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  PublicAppInfo,
  AppNavLinkStatus,
  AppStatus,
  WorkspaceAvailability,
} from '../../application';
import { IBasePath } from '../../http';
import { NavLinkWrapper } from './nav_link';
import { appendAppPath } from '../../application/utils';

export function toNavLink(app: PublicAppInfo, basePath: IBasePath): NavLinkWrapper {
  const useAppStatus = app.navLinkStatus === AppNavLinkStatus.default;
  let relativeBaseUrl = basePath.prepend(app.appRoute!);
  if (app.workspaceAvailability === WorkspaceAvailability.outsideWorkspace) {
    relativeBaseUrl = basePath.prepend(app.appRoute!, { withoutClientBasePath: true });
  }
  const url = relativeToAbsolute(appendAppPath(relativeBaseUrl, app.defaultPath));
  const baseUrl = relativeToAbsolute(relativeBaseUrl);

  return new NavLinkWrapper({
    ...app,
    hidden: useAppStatus
      ? app.status === AppStatus.inaccessible
      : app.navLinkStatus === AppNavLinkStatus.hidden,
    disabled: useAppStatus ? false : app.navLinkStatus === AppNavLinkStatus.disabled,
    baseUrl,
    href: url,
    url,
  });
}

/**
 * @param {string} url - a relative or root relative url.  If a relative path is given then the
 * absolute url returned will depend on the current page where this function is called from. For example
 * if you are on page "http://www.mysite.com/shopping/kids" and you pass this function "adults", you would get
 * back "http://www.mysite.com/shopping/adults".  If you passed this function a root relative path, or one that
 * starts with a "/", for example "/account/cart", you would get back "http://www.mysite.com/account/cart".
 * @return {string} the relative url transformed into an absolute url
 */
export function relativeToAbsolute(url: string) {
  const a = document.createElement('a');
  a.setAttribute('href', url);
  return a.href;
}
