/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2017 Red Hat, Inc.
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

import cockpit from 'cockpit';
import React from 'react';
import {
    vmId
} from "../helpers.es6";
import {
    Alert,
    Button,
    ListGroupItem,
    ListGroup,
    Grid,
    Modal
} from 'patternfly-react';
import { deleteVm } from '../actions/provider-actions.es6';

import './deleteDialog.css';

const _ = cockpit.gettext;

function DiskRow(props) {
    return (
        <ListGroupItem disabled={false}>
            <Grid.Col sm={1}>
                <input type="checkbox" checked={props.disk.checked} onChange={e => props.onChange(props.disk, e.target.checked)} />
            </Grid.Col>
            <Grid.Col sm={8}>
                {props.disk.file}
            </Grid.Col>
            <Grid.Col sm={3}>
                {props.disk.target}
            </Grid.Col>
        </ListGroupItem>
    );
}

export class DeleteDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            dialogError: undefined,
            disks: [],
            destroy: props.vm.state == 'running',
        };

        let vm = props.vm;
        Object.keys(vm.disks).sort()
                .forEach(t => {
                    let d = vm.disks[t];
                    if (d.type == 'file' && d.source.file)
                        this.state.disks.push({ target: d.target, file: d.source.file, checked: !d.readonly });
                });

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.save = this.save.bind(this);
        this.onValueChanged = this.onValueChanged.bind(this);
        this.onDiskCheckedChanged = this.onDiskCheckedChanged.bind(this);
    }

    onDiskCheckedChanged(disk, checked) {
        let disks = this.state.disks;
        disks.forEach(d => {
            if (d == disk)
                d.checked = checked;
        });

        this.setState(disks: disks);
    }

    onValueChanged(key, value) {
        const stateDelta = { [key]: value };

        this.setState(stateDelta);
    }

    dialogErrorSet(text) {
        this.setState({ dialogError: text });
    }

    dialogErrorDismiss() {
        this.setState({ dialogError: undefined });
    }

    close() {
        this.setState({ showModal: false });
        this.dialogErrorDismiss();
    }

    open() {
        this.setState({ showModal: true });
    }

    save() {
        const { dispatch, vm } = this.props;
        let storage = [ ];

        this.state.disks.forEach(d => { if (d.checked) storage.push(d.file); });
        dispatch(deleteVm(vm, { destroy: this.state.destroy, storage: storage }));
    }

    render () {
        const vm = this.props.vm;

        const idPrefix = vmId(vm.name);
        let caution = null;

        if (this.state.destroy) {
            caution = (<Alert> {_("The VM is running and will be forced off before deletion.")} </Alert>);
        }

        let defaultBody = null;
        if (this.state.disks.length > 0) {
            defaultBody = (
                <div>
                    <p>{_("Delete associated storage files:")}</p>
                    <ListGroup>
                        { this.state.disks.map((disk, i) => {
                            return <DiskRow disk={disk} key={disk.file} onChange={this.onDiskCheckedChanged} />;
                        })}
                    </ListGroup>
                </div>
            );
        }

        return (
            <div id={`${idPrefix}-link-dialog-full`}>
                <button key='action-delete' className="btn btn-danger" id={`${idPrefix}-delete`}
                        onClick={this.open}>
                    {_("Delete")}
                </button>

                <Modal id={`${idPrefix}-edit-dialog-modal-window`} show={this.state.showModal} onHide={this.close} className='nic-edit'>
                    <Modal.Header>
                        <Modal.CloseButton onClick={this.close} />
                        <Modal.Title> {cockpit.format(_("Confirm deletion of $0"), vm.name)} </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {caution}
                        {defaultBody}
                        {this.state.dialogError && (<Alert onDismiss={this.dialogErrorDismiss}> {this.state.dialogError} </Alert>)}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button id={`${idPrefix}-edit-dialog-cancel`} bsStyle='default' className='btn-cancel' onClick={this.close}>
                            {_("Cancel")}
                        </Button>
                        <Button id={`${idPrefix}-edit-dialog-save`} bsStyle='danger' onClick={this.save}>
                            {_("Delete")}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default DeleteDialog;
