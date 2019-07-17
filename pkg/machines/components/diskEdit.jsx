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
import { Button, Modal } from 'patternfly-react';
import cockpit from 'cockpit';

import { ModalError } from 'cockpit-components-inline-notification.jsx';
import { diskPropertyChanged } from "../helpers.js";

import 'form-layout.less';

const _ = cockpit.gettext;

const ReadonlyRow = ({ onValueChanged, readonly, idPrefix }) => {
    return (
        <input id={`${idPrefix}-readonlyytrytrytry`}
               type="checkbox"
               checked={readonly}
               onChange={e => onValueChanged('readonly', e.target.checked)} />
    );
};

class EditDiskModalBody extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            readonly: false,
            shareable: false
        };
        this.onValueChanged = this.onValueChanged.bind(this);
        this.dialogErrorSet = this.dialogErrorSet.bind(this);
        this.onSaveClicked = this.onSaveClicked.bind(this);
    }

    onValueChanged(key, value) {
        // console.log(key);
        // console.log(value);
        this.setState({ [key]: value });
    }

    dialogErrorSet(text, detail) {
        this.setState({ dialogError: text, dialogErrorDetail: detail });
    }

    onSaveClicked() {
        this.props.close();
    }

    render() {
        // console.info(this.state.readonly);
        const { vm, disk } = this.props;
        // const provider = this.props.provider;
        const idPrefix = `${this.props.idPrefix}-editdisk`;

        const defaultBody = (
            <div className='ct-form'>
                <ReadonlyRow readonly={this.state.readonly}
                             idPrefix={idPrefix}
                             onValueChanged={this.onValueChanged} />

            </div>
        );

        const showFooterWarning = () => {
            if (vm.state === 'running' && diskPropertyChanged(vm, disk.target, "readonly")) {
                return (
                    <span id={`${idPrefix}-edit-dialog-idle-messagepiopipiopio`} className='idle-message'>
                        <i className='pficon pficon-pending' />
                        <span>{_("Changes will take effect after shutting down the VM")}</span>
                    </span>
                );
            }
        };

        return (
            <Modal id={`${idPrefix}-dialog-modal-windowsadasdasdasa`} show onHide={this.props.close}>
                <Modal.Header>
                    <Modal.CloseButton onClick={this.props.close} />
                    <Modal.Title> {`Edit Disk`} </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {defaultBody}
                </Modal.Body>
                <Modal.Footer>
                    {this.state.dialogError && <ModalError dialogError={this.state.dialogError} dialogErrorDetail={this.state.dialogErrorDetail} />}
                    { showFooterWarning() }
                    <Button id={`${idPrefix}-dialog-cancelkhjkhjkhjkh`} bsStyle='default' className='btn-cancel' onClick={this.props.close}>
                        {_("Cancel")}
                    </Button>
                    <Button id={`${idPrefix}-dialog-editbvbvbvnvbn`} bsStyle='primary' onClick={this.onSaveClicked}>
                        {_("Save")}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export class EditDiskAction extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showModal: false };
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
    }

    close() {
        this.setState({ showModal: false });
    }

    open() {
        this.setState({ showModal: true });
    }

    render() {
        const { disk, vm, provider } = this.props;
        const idPrefix = `${this.props.idPrefix}`;

        return (
            <div id={`${idPrefix}-edit-dialog-fulhfmbmnbjjgl`}>
                <Button id={`${idPrefix}-editrewrwetwe5w`} bsStyle='default' onClick={this.open} className='pull-right' >
                    {_("Edit")}
                </Button>
                { this.state.showModal && <EditDiskModalBody close={this.close} disk={disk} idPrefix={idPrefix} vm={vm} provider={provider} /> }
            </div>
        );
    }
}
