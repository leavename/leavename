import React from 'react';
import {ScannerPage} from "./ScannerPage";
import {ViewerPage} from './ViewerPage';
import {Switch, Route} from 'react-router-dom';
import {STANDALONE_MODE_THEME, PRIVACY_MODE_THEME, SITE_ROUTES} from "../../constants";
import {TopMenuBar} from "../../components/TopMenuBar";
import {SplitButton} from "primereact/splitbutton";
import {ThemeContext, ToastContext} from "../../context";
import {RegisterShopDialog} from "../../components/RegisterShopDialog";
import {SwitchShopDialog} from "../../components/SwitchShopDialog";
import db from "../../db";

const BusinessPage = () => {
    const [shopList, setShopList] = React.useState([]);
    const showMessage = React.useContext(ToastContext);
    const {theme, setTheme} = React.useContext(ThemeContext);

    const [shop, setShop] = React.useState({});
    const [newShopPrompt, setNewShopPrompt] = React.useState(false);
    const [switchShopPrompt, setSwitchShopPrompt] = React.useState(false);


    const reloadShopList = () => db.table('shop').toArray().then(arr => setShopList(arr));
    React.useEffect(() => {
        reloadShopList();
        return () => setTheme(STANDALONE_MODE_THEME);
    }, [setTheme]);

    const model = [
        ...shopList.map(s => ({label: s.name, command: () => {
                setShop(s);
                showMessage({severity: 'success', summary: '切換成功', detail: `你現以${s.name}身份繼續`});
            }})),
        {label: '新店註冊', icon: 'pi pi-plus', command: () => setNewShopPrompt(true)},
        {label: '加入店舖', icon: 'pi pi-user-plus', command: () => setSwitchShopPrompt(true)},
        {label: '登出', icon: 'pi pi-sign-out', command: () => {
                setShop({});
            }}
    ];

    const inStandaloneMode = Object.keys(shop).length === 0;
    setTheme(inStandaloneMode ? STANDALONE_MODE_THEME : PRIVACY_MODE_THEME)

    return (
        <div>
            <RegisterShopDialog
                visible={newShopPrompt}
                setVisible={setNewShopPrompt}
                reloadShopList={reloadShopList}
                setShop={setShop}/>
            <SwitchShopDialog
                visible={switchShopPrompt}
                setVisible={setSwitchShopPrompt}
                reloadShopList={reloadShopList}
                setShop={setShop}/>
            <TopMenuBar end={<SplitButton label={inStandaloneMode ? '單機模式' : shop.name} icon='pi pi-user' model={model}/>}/>
            <Switch>
                <Route path={SITE_ROUTES.BUSINESS.VIEWER.URL}>
                    <ViewerPage shop={shop}/>
                </Route>
                <Route path={SITE_ROUTES.BUSINESS.SCANNER.URL}>
                    <ScannerPage shop={shop}/>
                </Route>
            </Switch>
        </div>
    )
}

export default BusinessPage
