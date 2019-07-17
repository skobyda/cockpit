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
import { convertToUnit, diskPropertyChanged, toReadableNumber, units } from "../helpers.js";
import { changeVmDiskReadOnly, changeVmDiskShareAble } from "../libvirt-dbus.js";
import WarningInactive from './warningInactive.jsx';

const _ = cockpit.gettext;

const StorageUnit = ({ value, id }) => {
    if (!value) {
        return null;
    }

    if (isNaN(value)) {
        return (
            <div id={id}>
                {value}
            </div>
        );
    }

    return (
        <div id={id}>
            {toReadableNumber(convertToUnit(value, units.B, units.GiB))}&nbsp;{_("GiB")}
        </div>
    );
};

const VmDiskCell = ({ value, id }) => {
    return (
        <div id={id}>
            {value}
        </div>
    );
};

class VmDisksTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            readonly: false,
            shareable: false
        };
    }

    render() {
        const { idPrefix, vm, disks, actions, renderCapacity, provider } = this.props;

        const columnTitles = [""];
        const disk = disks[0];
        const idPrefixRow = `${idPrefix}-${disk.target || disk.device}`;

        const columns = [];
        const diskActions = (
            <div key={`${idPrefixRow}-actionshrowehreiuwrw`} className='machines-network-actions'>
                <input id={`${idPrefix}-readonlyytrytrytry`}
                       type="checkbox"
                       checked={this.state.readonly}
                       onChange={e => this.setState({ readonly: e.target.checked })} />
            </div>
        );
        columns.push(diskActions);
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
    renderCapacity: PropTypes.bool,
    provider: PropTypes.string,
};

export default VmDisksTab;
