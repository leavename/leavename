import React from 'react';

import {Column} from "primereact/column";

import db from '../../db';
import {EM} from '../../constants';
import {ResponsiveCell, ResponsiveDataTable} from "../../components/ResponsiveDataTable";

export const ViewerPage = ({shop}) => {
    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [first, setFirst] = React.useState(0);
    const [totalRecords, setTotalRecords] = React.useState(0);
    const [rows, setRows] = React.useState(10);

    const inStandaloneMode = Object.keys(shop).length === 0;

    React.useEffect(() => {
        (async function fetchRecords() {
            const table = db.table(inStandaloneMode ? 'standaloneCheckIn' : 'encryptedCheckIn');
            const filteredTable = inStandaloneMode
                ? table.toCollection()
                : table.where('shopPubKey').equals(shop.shopPubKey);
            const totalRecords = await filteredTable.count()
            const records = await filteredTable.offset(first).limit(rows).reverse().sortBy('time');
            setLoading(false);
            setRecords(records);
            setTotalRecords(totalRecords);
        })();
    }, [first, rows, shop, inStandaloneMode])

    const paginationOptions = {
        paginator: true,
        lazy: true,
        paginatorTemplate: "FirstPageLink PageLinks LastPageLink",
        currentPageReportTemplate: "顯示 {first} 到 {last} 共 {totalRecords}",
        pageLinkSize: 4,
        first,
        rows,
        totalRecords,
        loading,
        onPage: ({first: newFirst, rows}) => {
            if (first !== newFirst) {
                setLoading(true);
                setFirst(newFirst);
                setRows(rows);
            }
        }
    }

    const header = (
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
            <span>記錄</span>
            <i
                onClick={() => {
                    const table = db.table(inStandaloneMode ? 'standaloneCheckIn' : 'encryptedCheckIn');
                    const filteredTable = inStandaloneMode
                        ? table.toCollection()
                        : table.where('shopPubKey').equals(shop.shopPubKey);
                    filteredTable.sortBy('time').then(arr => {
                        const csv = (inStandaloneMode
                            ? arr.map(({time, data: {name, phone}}) =>
                                [new Date(time).toLocaleString(), name, phone].join(','))
                            : arr.map(({time, data: {ciphertext}}) =>
                                [new Date(time).toLocaleString(), ciphertext].join(',')))
                            .join('\r\n');
                        const element = document.createElement('a');
                        const now = new Date().toLocaleString();
                        element.setAttribute(
                            'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
                        element.setAttribute(
                            'download',
                            inStandaloneMode
                                ? `LeaveName_Backup_${now}.csv`
                                : `LeaveName_Backup_${shop.name}_${now}.csv`
                        );
                        element.style.display = 'none';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                    })
                }}
                className="pi pi-download" />
        </div>
    )

    const EncryptedDatatable = (
        <ResponsiveDataTable
            value={records}
            header={header}
            {...paginationOptions}
        >
            <Column
                header='時間'
                body={rowData =>
                    <ResponsiveCell columnName='時間'>
                        {new Date(rowData.time).toLocaleString()}
                    </ResponsiveCell>
                }/>
            <Column
                header='密文'
                body={rowData =>
                    <ResponsiveCell columnName='密文'>
                        {rowData.data.ciphertext}
                    </ResponsiveCell>
                }
                bodyStyle={{maxWidth: '100%', textOverflow: 'ellipsis', overflow: 'hidden'}}/>
        </ResponsiveDataTable>
    )

    const PlaintextDataTable = (
        <ResponsiveDataTable
            value={records}
            header={header}
            {...paginationOptions}
        >
            <Column
                header='時間'
                body={rowData =>
                    <ResponsiveCell columnName='時間'>
                        {new Date(rowData.time).toLocaleString()}
                    </ResponsiveCell>}/>
            <Column
                header='名稱'
                body={rowData =>
                    <ResponsiveCell columnName='名稱'>
                        {rowData.data.name}
                    </ResponsiveCell>}/>
            <Column
                header='電話號碼'
                body={rowData =>
                    <ResponsiveCell columnName='電話號碼'>
                        {rowData.data.phone}
                    </ResponsiveCell>}/>
        </ResponsiveDataTable>
    )

    return (
        <div>
            <div style={{margin: EM * 2}}>
                {inStandaloneMode ? PlaintextDataTable : EncryptedDatatable}
            </div>
        </div>
    )
}