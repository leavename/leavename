import React from 'react';
import styled from 'styled-components';
import {DataTable} from "primereact/datatable";
import PropTypes from "prop-types";

export const ResponsiveDataTable = styled(DataTable)`
    .p-datatable-tbody > tr > td .p-column-title {
        display: none;
    }
    
    @media screen and (max-width: 40em) {
        .p-datatable-thead > tr > th,
        .p-datatable-tfoot > tr > td {
            display: none !important;
        }
    
        .p-datatable-tbody > tr > td {
            text-align: left;
            display: block;
            width: 100%;
            float: left;
            clear: left;
            border: 0 none;
        }
    
        .p-datatable-tbody > tr > td .p-column-title {
            padding: .4rem;
            min-width: 30%;
            display: inline-block;
            margin: -.4em 1em -.4em -.4rem;
            font-weight: bold;
        }
    
        .p-datatable-tbody > tr > td:last-child {
            border-bottom: 1px solid var(--surface-d);
        }
    }
`;

export const ResponsiveCell = ({columnName, children}) => (
    <React.Fragment>
        <span className="p-column-title">{columnName}</span>
        {children}
    </React.Fragment>
)

ResponsiveCell.propTypes = {
    columnName: PropTypes.string,
    children: PropTypes.any,
}