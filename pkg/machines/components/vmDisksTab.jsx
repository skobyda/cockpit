/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2016 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */
import "form-layout.less";
import React from 'react';
import PropTypes from 'prop-types';
import cockpit from 'cockpit';

import { Listing, ListingRow } from 'cockpit-components-listing.jsx';

const _ = cockpit.gettext;

class VmDisksTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            readonly: false,
            shareable: false
        };
    }

    render() {
        const { idPrefix, disks, actions } = this.props;

        const columnTitles = [""];
        const disk = disks[0];
        const idPrefixRow = `${idPrefix}-${disk.target || disk.device}`;

        const diskActions = (
            <input id={`${idPrefix}-readonlyytrytrytry`}
                   type="checkbox"
                   checked={this.state.readonly}
                   onChange={e => this.setState({ readonly: e.target.checked })} />
        );
        const columns = [diskActions];
        return (
            <div className="machines-disks">
                <Listing compact columnTitles={columnTitles} actions={actions} emptyCaption={_("No disks defined for this VM")}>
                    <ListingRow key={idPrefixRow} columns={columns} navigateToItem={disk.onNavigate} />
                </Listing>
            </div>
        );
    }
}

VmDisksTab.propTypes = {
    idPrefix: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.node),
    disks: PropTypes.array.isRequired,
};

export default VmDisksTab;
