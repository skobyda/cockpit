
/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2018 Red Hat, Inc.
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
import { Button, ExpandCollapse, Modal } from 'patternfly-react';

import { ModalError } from '../notification/inlineNotification.jsx';
import './editNetworkDialog.css';
import { changeNetworkSettings } from '../../libvirt-dbus.js'
import cockpit from 'cockpit';

const _ = cockpit.gettext;

class EditNetworkModal extends React.Component {
    constructor(props) {
        super(props);

        let ip = [];
        // Libvirt allows network to have multiple ipv6 and ipv4 addresses.
        // But we only first one of each
        ip[0] = props.network.ip.find(ip => ip.family === "ipv4");
        ip[1] = props.network.ip.find(ip => ip.family === "ipv6");

        this.state = {
            dialogError: undefined,
            ipv4Address: ip[0] ? ip[0].address : undefined,
            ipv4Netmask: ip[0] ? ip[0].netmask : undefined,
            ipv6Address: ip[1] ? ip[1].address : undefined,
            ipv6Prefix: ip[1] ? ip[1].prefix : undefined,

        };
        this.dialogErrorSet = this.dialogErrorSet.bind(this);
        this.dialogErrorDismiss = this.dialogErrorDismiss.bind(this);
        this.onValueChanged = this.onValueChanged.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    dialogErrorSet(text, detail) {
        this.setState({ dialogError: text, dialogErrorDetail: detail });
    }

    dialogErrorDismiss() {
        this.setState({ dialogError: undefined });
    }

    onValueChanged(key, value) {
        this.setState({ [key]: value });
    }

    onSave() {
        dispatch = this.props.dispatch;

        dispatch(changeNetworkSettings(this.state))
                .fail(exc => {
                        this.dialogErrorSet(_("Network Setting failed to be saved"), exc.message);
                });
                .then(() => {
                    this.props.close();
                });
    }

    render() {
        // const { network } = this.props;
        const defaultBody = (
            <React.Fragment>
                <ExpandCollapse textCollapsed="IPv4 Options" textExpanded="IPv4 Options">
                    <div className="edit-network-dialog-grid">
                        <React.Fragment>
                            <input id='network-ipv4-address'
                                   type='text'
                                   value={this.state.ipv4Address}
                                   placeholder='Address'
                                   onChange={e => this.onValueChanged('ipv4Address', e.target.value)}
                                   className='form-control' />
                        </React.Fragment>
                        <React.Fragment>
                            <input id='network-ipv4-address'
                                   type='text'
                                   value={this.state.ipv4Netmask}
                                   placeholder='Netmask'
                                   onChange={e => this.onValueChanged('ipv4Netmask', e.target.value)}
                                   className='form-control' />
                        </React.Fragment>
                    </div>
                </ExpandCollapse>
                <ExpandCollapse textCollapsed="IPv6 Options" textExpanded="IPv6 Options">
                    <div className="edit-network-dialog-grid">
                        <React.Fragment>
                            <input id='network-ipv4-address'
                                   type='text'
                                   value={this.state.ipv6Address}
                                   placeholder='Address'
                                   onChange={e => this.onValueChanged('ipv6Address', e.target.value)}
                                   className='form-control' />
                        </React.Fragment>
                        <React.Fragment>
                            <input id='network-ipv4-address'
                                   type='text'
                                   value={this.state.ipv6Prefix}
                                   placeholder='Prefix'
                                   onChange={e => this.onValueChanged('ipv6Prefix', e.target.value)}
                                   className='form-control' />
                        </React.Fragment>
                    </div>
                </ExpandCollapse>
            </React.Fragment>
        );

        return (
            <Modal id='edit-network-dialog' className='network-create' show onHide={ this.props.close }>
                <Modal.Header>
                    <Modal.CloseButton onClick={ this.props.close } />
                    <Modal.Title> {`Edit Network`} </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {defaultBody}
                </Modal.Body>
                <Modal.Footer>
                    {this.state.dialogError && <ModalError dialogError={this.state.dialogError} dialogErrorDetail={this.state.dialogErrorDetail} />}
                    <Button bsStyle='default' className='btn-cancel' onClick={ this.props.close }>
                        {_("Cancel")}
                    </Button>
                    <Button bsStyle='primary' onClick={this.onSave}>
                        {_("Save")}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
EditNetworkModal.propTypes = {
    close: PropTypes.func.isRequired,
    network: PropTypes.object.isRequired,
    // dispatch: PropTypes.func.isRequired,
};

export class EditNetworkAction extends React.Component {
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
        return (
            <React.Fragment>
                <Button className='pull-right' id='edit-network'
                        bsStyle='default' onClick={this.open} >
                    {_("Edit")}
                </Button>
                { this.state.showModal &&
                <EditNetworkModal
                    close={this.close}
                    dispatch={this.props.dispatch}
                    network={this.props.network} /> }
            </React.Fragment>
        );
    }
}
EditNetworkAction.propTypes = {
    dispatch: PropTypes.func.isRequired,
};
