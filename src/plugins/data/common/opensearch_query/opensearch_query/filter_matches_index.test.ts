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

import { Filter, QueryStringFilter } from '../filters';
import { filterMatchesIndex } from './filter_matches_index';
import { IIndexPattern } from '../../index_patterns';

describe('filterMatchesIndex', () => {
  it('should return true if the filter has no meta', () => {
    const filter = {} as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return true if no index pattern is passed', () => {
    const filter = { meta: { index: 'foo', key: 'bar' } } as Filter;

    expect(filterMatchesIndex(filter, undefined)).toBe(true);
  });

  it('should return true if the filter key matches a field name', () => {
    const filter = { meta: { index: 'foo', key: 'bar' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return false if the filter key does not match a field name', () => {
    const filter = { meta: { index: 'foo', key: 'baz' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(false);
  });

  it('should return true if the filter has meta without a key', () => {
    const filter = { meta: { index: 'foo' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return false if the custom filter is a different index id', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'custom' } } as Filter;
    const indexPattern = { id: 'bar', fields: [{ name: 'foo' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(false);
  });

  it('should return true if the custom filter is the same index id', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'custom' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'barf' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return false if a query string filter cannot be parsed', () => {
    const filter = {
      meta: { key: 'query', type: 'query_string' },
      query: { query_string: { query: 'foo"bar' } },
    } as QueryStringFilter;
    const indexPattern = { id: 'bar', fields: [{ name: 'foo' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(false);
  });

  it('should return true if a query string filter references fields in an index', () => {
    const filter = {
      meta: { key: 'query', type: 'query_string' },
      query: { query_string: { query: 'foo: bar AND baz: firzle' } },
    } as QueryStringFilter;
    const indexPattern = { id: 'bar', fields: [{ name: 'foo' }, { name: 'baz' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return false if a query string filter references fields not in an index', () => {
    const filter = {
      meta: { key: 'query', type: 'query_string' },
      query: { query_string: { query: 'foo: bar AND baz: firzle' } },
    } as QueryStringFilter;
    const indexPattern = { id: 'bar', fields: [{ name: 'foo' }] } as IIndexPattern;

    expect(filterMatchesIndex(filter, indexPattern)).toBe(false);
  });
});
