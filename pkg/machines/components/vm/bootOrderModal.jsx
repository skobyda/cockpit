/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2019 Red Hat, Inc.
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
import {
    Button, Alert, Modal,
    DataList,
    DataListItem,
    DataListCell,
    DataListItemRow,
    DataListCheck,
    DataListControl,
    DataListDragButton,
    DataListItemCells,
    DataListWrapModifier,
} from '@patternfly/react-core';

import { ModalError } from 'cockpit-components-inline-notification.jsx';
import {
    findHostNodeDevice,
    getSortedBootOrderDevices,
    rephraseUI,
    vmId
} from '../../helpers.js';
import {
    changeBootOrder,
    getVm
} from '../../actions/provider-actions.js';

import './bootOrderModal.css';

const _ = cockpit.gettext;

/**
 * Return an array of devices, which can assigned boot order, with added properties needed for UI.
 *
 * @param {object} vm
 * @returns {array}
 */
function getUIBootOrderDevices(vm) {
    const devices = getSortedBootOrderDevices(vm.inactiveXML);

    devices.forEach(dev => {
        dev.checked = typeof dev.bootOrder !== 'undefined';
        dev.initialOrder = parseInt(dev.bootOrder);
    });

    return devices;
}

const DeviceInfo = ({ descr, value }) => {
    return (
        <div className='ct-form'>
            <label className='control-label' htmlFor={value}>
                {descr}
            </label>
            <span id={value}>
                {value}
            </span>
        </div>
    );
};

const DeviceRow = ({ idPrefix, device, index, onToggle, upDisabled, downDisabled, moveDown, nodeDevices }) => {
    let heading;
    const additionalInfo = [];

    const addOptional = (additionalInfo, value, descr) => {
        if (value) {
            additionalInfo.push(
                <DeviceInfo descr={descr} value={value} key={index + descr} />
            );
        }
    };

    switch (device.type) {
    case "disk": {
        heading = rephraseUI("bootableDisk", "disk");
        addOptional(additionalInfo, device.device.source.file, _("File"));
        addOptional(additionalInfo, device.device.source.dev, _("Device"));
        addOptional(additionalInfo, device.device.source.protocol, _("Protocol"));
        addOptional(additionalInfo, device.device.source.pool, _("Pool"));
        addOptional(additionalInfo, device.device.source.volume, _("Volume"));
        addOptional(additionalInfo, device.device.source.host.name, _("Host"));
        addOptional(additionalInfo, device.device.source.host.port, _("Port"));
        break;
    }
    case "network": {
        heading = rephraseUI("bootableDisk", "network");
        addOptional(additionalInfo, device.device.mac, _("MAC"));
        break;
    }
    case "redirdev": {
        heading = rephraseUI("bootableDisk", "redirdev");
        addOptional(additionalInfo, device.device.type, _("Type"));
        addOptional(additionalInfo, device.device.bus, _("Bus"));
        addOptional(additionalInfo, device.device.address.port, _("Port"));
        break;
    }
    case "hostdev": {
        heading = rephraseUI("bootableDisk", "hostdev");
        const nodeDev = findHostNodeDevice(device.device, nodeDevices);
        if (nodeDev) {
            switch (device.device.type) {
            case "usb": {
                addOptional(additionalInfo, device.device.type, _("Type"));
                addOptional(additionalInfo, nodeDev.capability.vendor._value, _("Vendor"));
                addOptional(additionalInfo, nodeDev.capability.product._value, _("Product"));
                break;
            }
            case "pci": {
                addOptional(additionalInfo, device.device.type, _("Type"));
                addOptional(additionalInfo, nodeDev.capability.vendor._value, _("Vendor"));
                addOptional(additionalInfo, nodeDev.capability.product._value, _("Product"));
                break;
            }
            case "scsi": {
                addOptional(additionalInfo, device.device.type, _("Type"));
                addOptional(additionalInfo, device.device.source.address.bus, _("Bus"));
                addOptional(additionalInfo, device.device.source.address.target, _("Target"));
                addOptional(additionalInfo, device.device.source.address.unit, _("Unit"));
                break;
            }
            case "scsi_host": {
                addOptional(additionalInfo, device.device.type, _("Type"));
                addOptional(additionalInfo, device.device.source.protocol, _("Protocol"));
                addOptional(additionalInfo, device.device.source.wwpn, _("WWPN"));
                break;
            }
            case "mdev": {
                addOptional(additionalInfo, device.device.type, _("Type"));
                addOptional(additionalInfo, nodeDev.capability.type.id, _("Type ID"));
                break;
            }
            }
        }
        break;
    }
    }

    // const upArrow = <Button isDisabled={upDisabled} onClick={moveUp}><Icon id={`${idPrefix}-up`} type="fa" name="angle-up" /></Button>;
    // const downArrow = <Button isDisabled={downDisabled} onClick={moveDown}><Icon id={`${idPrefix}-down`} type="fa" name="angle-down" /></Button>;

    /* const actions = (
        <ButtonGroup>
            {upArrow}
            {downArrow}
        </ButtonGroup>
    );

    const checkbox = (
        <label htmlFor={`${idPrefix}-device-row-${index}-checkbox`}>
            <input id={`${idPrefix}-device-row-${index}-checkbox`} type="checkbox" checked={device.checked} onChange={onToggle} />
        </label>
    ); */

    return (
        <DataListItem aria-labelledby="device-row-" id={`${idPrefix}-device-row-${index}`} key={index}>
            <DataListItemRow>
                <DataListControl>
                    <DataListDragButton
                        aria-label="Reorder"
                        aria-labelledby="simple-item1"
                        aria-describedby="Press space or enter to begin dragging, and use the arrow keys to navigate up or down. Press enter to confirm the drag, or any other key to cancel the drag operation."
                        aria-pressed="false" />
                    <DataListCheck aria-labelledby="simple-item1" name="check1" otherControls />
                </DataListControl>
                <DataListItemCells
                    dataListCells={[
                        <DataListCell key="heading" wrapModifier={DataListWrapModifier.breakWord}>
                            {heading}
                        </DataListCell>,
                        <DataListCell key="additional-info" wrapModifier={DataListWrapModifier.truncate}>
                            {additionalInfo}
                        </DataListCell>
                    ]} />
            </DataListItemRow>
        </DataListItem>
    );
    /* <ListViewItem
            id={`${idPrefix}-device-row-${index}`}
            className={ device.checked ? "is-checked" : "" }
            checkboxInput={checkbox}
            heading={heading}
            additionalInfo={additionalInfo}
            actions={actions}
        />
        */
};

export class BootOrderModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            devices: getUIBootOrderDevices(props.vm),
            deviceOrder: getUIBootOrderDevices(props.vm).map((dev, index) => `${vmId(props.vm.name)}-device-row-${index}`)
        };
        this.dialogErrorSet = this.dialogErrorSet.bind(this);
        this.close = props.close;
        this.save = this.save.bind(this);
        this.onToggleDevice = this.onToggleDevice.bind(this);
        this.onDragFinish = this.onDragFinish.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragCancel = this.onDragCancel.bind(this);
    }

    onDragFinish(itemOrder) {
        console.log("dragFinish", itemOrder);
        this.setState({ deviceOrder: itemOrder });
    }

    onDragMove(oldIndex, newIndex) {
        console.log("dragMove", oldIndex, newIndex);
        const itemOrder = [...this.state.deviceOrder];
        const tmp = itemOrder[oldIndex];
        itemOrder[oldIndex] = itemOrder[newIndex];
        itemOrder[newIndex] = tmp;
        this.setState({ deviceOrder: itemOrder });
    }

    onDragStart() {
        console.log("dragStart");
    }

    onDragCancel() {
        console.log("dragCancel");
    }

    dialogErrorSet(text, detail) {
        this.setState({ dialogError: text, dialogErrorDetail: detail });
    }

    save() {
        const { dispatch, vm } = this.props;
        const devices = this.state.devices.filter((device) => device.checked);

        dispatch(changeBootOrder({
            vm,
            devices,
        }))
                .fail(exc => this.dialogErrorSet(_("Boot order settings could not be saved"), exc.message))
                .then(() => {
                    dispatch(getVm({ connectionName: vm.connectionName, id: vm.id }));
                    this.close();
                });
    }

    onToggleDevice(device) {
        // create new array so we don't edit state
        const devices = [...this.state.devices];

        devices[devices.indexOf(device)].checked = !devices[devices.indexOf(device)].checked;

        this.setState({ devices: devices });
    }

    /*
    moveUp(device) {
        const direction = -1;
        // create new array so we don't edit state
        const devices = [...this.state.devices];

        const index = devices.indexOf(device);
        const tmp = devices[index + direction];
        devices[index + direction] = devices[index];
        devices[index] = tmp;

        this.setState({ devices: devices });
    }

    moveDown(device) {
        const direction = 1;
        // create new array so we don't edit state
        const devices = [...this.state.devices];

        const index = devices.indexOf(device);
        const tmp = devices[index + direction];
        devices[index + direction] = devices[index];
        devices[index] = tmp;

        this.setState({ devices: devices });
    } */

    render() {
        const { nodeDevices, vm } = this.props;
        const idPrefix = vmId(vm.name) + '-order-modal';

        /**
         * Returns whetever state of device represented in UI has changed
         *
         * @param {object} device
         * @param {number} index order of device in list
         * @returns {boolean}
         */
        function deviceStateHasChanged(device, index) {
            // device was selected
            if (device.checked && !device.initialOrder)
                return true;

            // device was unselected
            if (!device.checked && device.initialOrder)
                return true;

            // device was moved in boot order list
            if (device.initialOrder && device.initialOrder !== index + 1)
                return true;

            return false;
        }

        const showWarning = () => {
            if (vm.state === "running" &&
                this.state.devices.some((device, index) => deviceStateHasChanged(device, index))) {
                return <Alert isInline variant='warning' id={`${idPrefix}-min-message`} title={_("Changes will take effect after shutting down the VM")} />;
            }
        };

        console.log(this.state.devices);
        console.log(this.state.deviceOrder);
        const defaultBody = (
            <div className="list-group dialog-list-ct">
                <DataList
                  aria-label="draggable data list example"
                  isCompact
                  onDragFinish={this.onDragFinish}
                  onDragStart={this.onDragStart}
                  onDragMove={this.onDragMove}
                  onDragCancel={this.onDragCancel}
                  itemOrder={this.state.deviceOrder}>
                    {this.state.devices.map((device, index) => {
                        const nextDevice = this.state.devices[index + 1];
                        return <DeviceRow
                                    key={index}
                                    idPrefix={idPrefix}
                                    index={index}
                                    device={device}
                                    onClick={() => this.onToggleDevice(device)}
                                    onToggle={() => this.onToggleDevice(device)}
                                    upDisabled={!index || !device.checked}
                                    downDisabled={index + 1 == this.state.devices.length || !nextDevice.checked}
                                    nodeDevices={nodeDevices}
                        />;
                    })}
                </DataList>
            </div>
        );
        /* <ListView className="boot-order-list-view">
            {this.state.devices.map((device, index) => {
                const nextDevice = this.state.devices[index + 1];
                return <DeviceRow
                            key={index}
                            idPrefix={idPrefix}
                            index={index}
                            device={device}
                            onClick={() => this.onToggleDevice(device)}
                            onToggle={() => this.onToggleDevice(device)}
                            upDisabled={!index || !device.checked}
                            downDisabled={index + 1 == this.state.devices.length || !nextDevice.checked}
                            moveUp={() => this.moveUp(device)}
                            moveDown={() => this.moveDown(device)}
                            nodeDevices={nodeDevices}
                />;
            })}
        </ListView> */
        const title = _("Boot order");

        return (
            <Modal position="top" variant="medium" id={`${idPrefix}-window`} isOpen onClose={this.close} className='boot-order'
                   title={`${vm.name} ${title}`}
                   footer={
                       <>
                           {this.state.dialogError && <ModalError dialogError={this.state.dialogError} dialogErrorDetail={this.state.dialogErrorDetail} />}
                           <Button id={`${idPrefix}-save`} variant='primary' onClick={this.save}>
                               {_("Save")}
                           </Button>
                           <Button id={`${idPrefix}-cancel`} variant='link' onClick={this.close}>
                               {_("Cancel")}
                           </Button>
                       </>
                   }>
                <>
                    {showWarning()}
                    {defaultBody}
                </>
            </Modal>
        );
    }
}

BootOrderModal.propTypes = {
    close: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    vm: PropTypes.object.isRequired,
    nodeDevices: PropTypes.array.isRequired,
};

export default BootOrderModal;
