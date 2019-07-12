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
import React from 'react';
import PropTypes from 'prop-types';
import cockpit from 'cockpit';

import { Listing, ListingRow } from 'cockpit-components-listing.jsx';
import { convertToUnit, toReadableNumber, units } from "../helpers.js";
import { changeVmDiskReadOnly, changeVmDiskShareAble } from "../libvirt-dbus.js";
import RemoveDiskAction from './diskRemove.jsx';
import WarningInactive from './warningInactive.jsx';

import './vmDisksTab.css';

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

const diskPropertyChanged = (vm, diskTarget, property) => {
    const disk = vm.disks[diskTarget];
    const inactiveDisk = vm.inactiveXML.disks[diskTarget];

    if (disk && inactiveDisk) // only persistent disks
        return disk[property] !== inactiveDisk[property];
    else
        return false;
};

const VmDisksTab = ({ idPrefix, vm, disks, actions, renderCapacity, dispatch, provider, onAddErrorNotification }) => {
    const columnTitles = [_("Device")];
    let renderCapacityUsed, renderReadOnly, renderShareAble, renderAdditional;

    if (disks && disks.length > 0) {
        renderCapacityUsed = !!disks.find(disk => (!!disk.used));
        renderReadOnly = !!disks.find(disk => (typeof disk.readonly !== "undefined"));
        renderAdditional = !!disks.find(disk => (!!disk.diskExtras));
        /* Only raw format supports shareable option.
         * see: https://www.redhat.com/archives/libvir-list/2017-November/msg00617.html
         * or
         * see: https://www.ovirt.org/documentation/admin-guide/chap-Virtual_Machine_Disks.html#uploading-a-disk-image-to-a-storage-domain
         */
        renderShareAble = !!disks.find(disk => (typeof disk.shareable !== "undefined" && disk.driver && disk.driver.type === "raw"));

        if (renderCapacity) {
            if (renderCapacityUsed) {
                columnTitles.push(_("Used"));
            }
            columnTitles.push(_("Capacity"));
        }
        columnTitles.push(_("Bus"));
        if (renderReadOnly) {
            columnTitles.push(_("Readonly"));
        }
        if (renderShareAble) {
            columnTitles.push(_("Shareable"));
        }
        columnTitles.push(_("Source"));
        if (renderAdditional)
            columnTitles.push(_("Additional"));
        // An empty string header is needed for detach actions
        columnTitles.push("");
    }

    return (
        <div className="machines-disks">
            <Listing compact columnTitles={columnTitles} actions={actions} emptyCaption={_("No disks defined for this VM")}>
                {disks.map(disk => {
                    const idPrefixRow = `${idPrefix}-${disk.target || disk.device}`;
                    const columns = [
                        { name: <VmDiskCell value={disk.device} id={`${idPrefixRow}-device`} key={`${idPrefixRow}-device`} />, 'header': true },
                    ];

                    if (renderCapacity) {
                        if (renderCapacityUsed) {
                            columns.push(<StorageUnit value={disk.used} id={`${idPrefixRow}-used`} key={`${idPrefixRow}-used`} />);
                        }
                        columns.push(<StorageUnit value={disk.capacity} id={`${idPrefixRow}-capacity`} key={`${idPrefixRow}-capacity`} />);
                    }

                    columns.push(<VmDiskCell value={disk.bus} id={`${idPrefixRow}-bus`} key={`${idPrefixRow}-bus`} />);

                    if (renderReadOnly) {
                        // Configuration supported only for persistent disks
                        if (provider === 'LibvirtDBus' && vm.inactiveXML.disks[disk.target]) {
                            const readOnly = (
                                <label className='checkbox-inline'>
                                    <input id={`${idPrefixRow}-readonly`}
                                           className='checkbox-listing'
                                           type="checkbox"
                                           checked={disk.readonly}
                                           onChange={() => changeVmDiskReadOnly(vm.connectionName, vm.id, disk.target)} />
                                    { vm.state === "running" && diskPropertyChanged(vm, disk.target, "readonly") &&
                                        <WarningInactive iconId={`${idPrefixRow}-readonly-tooltip`} tooltipId={`tip-${idPrefixRow}-readonly`} /> }
                                </label>
                            );

                            columns.push(readOnly);
                        } else {
                            columns.push(disk.readonly ? _("yes") : _("no"));
                        }
                    }

                    if (renderShareAble) {
                        /* Only raw format supports shareable option.
                         * see: https://www.redhat.com/archives/libvir-list/2017-November/msg00617.html
                         * or
                         * see: https://www.ovirt.org/documentation/admin-guide/chap-Virtual_Machine_Disks.html#uploading-a-disk-image-to-a-storage-domain
                         */
                        if (disk.driver && disk.driver.type === "raw") {
                            // Configuration supported only for persistent disks
                            if (provider === 'LibvirtDBus' && vm.inactiveXML.disks[disk.target]) {
                                const shareAble = (
                                    <label className='checkbox-inline'>
                                        <input id={`${idPrefixRow}-shareable`}
                                               className='checkbox-listing'
                                               type="checkbox"
                                               checked={disk.shareable}
                                               onChange={() => changeVmDiskShareAble(vm.connectionName, vm.id, disk.target)} />
                                        { vm.state === "running" && diskPropertyChanged(vm, disk.target, "shareable") &&
                                            <WarningInactive iconId={`${idPrefixRow}-shareable-tooltip`} tooltipId={`tip-${idPrefixRow}-shareable`} /> }
                                    </label>
                                );

                                columns.push(shareAble);
                            } else {
                                columns.push(disk.shareable ? _("yes") : _("no"));
                            }
                        } else {
                            columns.push(null);
                        }
                    }

                    columns.push(disk.diskSourceCell);
                    columns.push(disk.diskExtras);

                    if (provider === 'LibvirtDBus') {
                        const removeDiskAction = RemoveDiskAction({
                            dispatch,
                            vm,
                            target: disk.target,
                            idPrefixRow,
                            onAddErrorNotification,
                        });
                        columns.push(removeDiskAction);
                    }

                    return (<ListingRow key={idPrefixRow} columns={columns} navigateToItem={disk.onNavigate} />);
                })}
            </Listing>
        </div>
    );
};

VmDisksTab.propTypes = {
    idPrefix: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.node),
    disks: PropTypes.array.isRequired,
    renderCapacity: PropTypes.bool,
    provider: PropTypes.string,
    onAddErrorNotification: PropTypes.func.isRequired,
};

export default VmDisksTab;
