import React from 'react';

import db from '../../db';
import {ToastContext} from "../../context";
import {CLIENT_VERSION} from "../../constants";
import {asymmetricEncrypt} from "../../cryptography";
import {QRScanner} from "../../components/QRScanner";

export const ScannerPage = ({shop}) => {
    const showMessage = React.useContext(ToastContext);
    const inStandaloneMode = Object.keys(shop).length === 0;

    return (
        <div>
            <div style={{margin: '1em'}}>
                <QRScanner
                    disabled={false}
                    callback={code => {
                        const customer = JSON.parse(code.data)
                        const escaped = {...customer, name: decodeURIComponent(customer.name)};
                        (async function() {
                            if (inStandaloneMode) {
                                await db.table('standaloneCheckIn').add({
                                    time: new Date().getTime(),
                                    clientVersion: CLIENT_VERSION,
                                    data: escaped,
                                });
                            } else {
                                const ciphertext = asymmetricEncrypt(
                                    escaped,
                                    Uint8Array.from(atob(shop.shopPubKey), c => c.charCodeAt(0)),
                                    Uint8Array.from(atob(shop.serverPubKey), c => c.charCodeAt(0)));
                                await db.table('encryptedCheckIn').add({
                                    time: new Date().getTime(),
                                    clientVersion: CLIENT_VERSION,
                                    shopPubKey: shop.shopPubKey,
                                    data: {ciphertext},
                                });
                            }
                            showMessage({severity: 'success', summary: '已記錄', detail: `客人：${escaped.name} | 電話號碼：${escaped.phone}`});
                        })();
                    }}/>
            </div>
        </div>
    )
}