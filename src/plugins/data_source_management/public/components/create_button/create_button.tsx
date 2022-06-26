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

// @ts-ignore
import { euiColorAccent } from '@elastic/eui/dist/eui_theme_light.json';
import React, { Component, Fragment } from 'react';

import {
  EuiBadge,
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiPopover,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

interface State {
  isPopoverOpen: boolean;
}

interface Props {
  options: Array<{
    text: string;
    description?: string;
    testSubj?: string;
    isBeta?: boolean;
    onClick: () => void;
  }>;
}

export class CreateButton extends Component<Props, State> {
  public state = {
    isPopoverOpen: false,
  };

  public render() {
    const { options, children } = this.props;
    const { isPopoverOpen } = this.state;

    if (!options || !options.length) {
      return null;
    }

    if (options.length === 1) {
      return (
        <EuiButton
          data-test-subj="createDataSourceButton"
          fill={true}
          onClick={options[0].onClick}
          iconType="plusInCircle"
        >
          {children}
        </EuiButton>
      );
    }

    const button = (
      <EuiButton
        data-test-subj="createDataSourceButton"
        fill={true}
        size="s"
        iconType="arrowDown"
        iconSide="right"
        onClick={this.togglePopover}
      >
        {children}
      </EuiButton>
    );

    if (options.length > 1) {
      return (
        <EuiPopover
          id="singlePanel"
          button={button}
          isOpen={isPopoverOpen}
          closePopover={this.closePopover}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenuPanel
            items={options.map((option) => {
              return (
                <EuiContextMenuItem
                  key={option.text}
                  onClick={option.onClick}
                  data-test-subj={option.testSubj}
                >
                  <EuiDescriptionList style={{ whiteSpace: 'nowrap' }}>
                    <EuiDescriptionListTitle>
                      {option.text}
                      {option.isBeta ? <Fragment> {this.renderBetaBadge()}</Fragment> : null}
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {option.description}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiContextMenuItem>
              );
            })}
          />
        </EuiPopover>
      );
    }
  }

  private togglePopover = () => {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen,
    });
  };

  private closePopover = () => {
    this.setState({
      isPopoverOpen: false,
    });
  };

  private renderBetaBadge = () => {
    return (
      <EuiBadge color={euiColorAccent}>
        <FormattedMessage
          id="dataSourceManagement.dataSourceList.createButton.betaLabel"
          defaultMessage="Beta"
        />
      </EuiBadge>
    );
  };
}
