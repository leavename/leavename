import React from 'react';
import {Menubar} from "primereact/menubar";
import {useHistory} from 'react-router-dom';
import {SITE_ROUTES, TUTORIAL_LINK} from "../constants";
import PropTypes from "prop-types";


export const TopMenuBar = ({id, style, className, start, end}) => {
    let history = useHistory();
    const items = [{
        label: '客人',
        icon: 'pi pi-users',
        items: [{
            label: '留名',
            icon: 'pi pi-id-card',
            command: () => history.push(SITE_ROUTES.CLIENT.URL)
        }]
    }, {
        label: '店家',
        icon: 'pi pi-briefcase',
        items: [{
            label: '掃描',
            icon: 'pi pi-camera',
            command: () => history.push(SITE_ROUTES.BUSINESS.SCANNER.URL)
        }, {
            label: '記錄',
            icon: 'pi pi-list',
            command: () => history.push(SITE_ROUTES.BUSINESS.VIEWER.URL)
        }]
    }, {
        label: '使用教學',
        icon: 'pi pi-book',
        command: () => window.location = TUTORIAL_LINK,
    }];
    return (
        <Menubar
            id={id}
            style={style}
            className={className}
            start={start}
            end={end}
            model={items}
        />
    )
}

TopMenuBar.propTypes = {
    id: PropTypes.string,
    model: PropTypes.array,
    style: PropTypes.object,
    className: PropTypes.string,
    start: PropTypes.any,
    end: PropTypes.any,
}