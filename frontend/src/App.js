import React from 'react';
import {Toast} from "primereact/toast";
import {ThemeContext, ToastContext} from "./context";
import styled from 'styled-components';
import ClientPage from "./pages/Client";
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {SITE_ROUTES, STANDALONE_MODE_THEME} from "./constants";
import BusinessPage from "./pages/Business";


const ResponsiveToast = styled(Toast)`
@media (min-width: 280px) {
    width: 15rem;
    font-size: 10px;
}
@media (min-width: 320px) {
    width: 18rem;
    font-size: 1em;
}
@media (min-width: 375px) {
  width: 20rem;
  font-size: 1em;
}
`

const App = () => {
    const toastRef = React.createRef();
    const [theme, setTheme] = React.useState(STANDALONE_MODE_THEME);

    React.useEffect(() => {
        const head = document.head;
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = `/themes/${theme}/theme.css`;
        head.appendChild(link);
        return () => {
            head.removeChild(link);
        }
    }, [theme])


    return (
        <ToastContext.Provider value={props => {
            if (toastRef.current) {
                toastRef.current.show(props);
            } else {
                const {severity, summary, detail} = props;
                alert(`${severity.toUpperCase()}: ${summary} \n ${detail}`)
            }
        }}>
            <ThemeContext.Provider value={{theme, setTheme}}>
                <ResponsiveToast ref={toastRef}/>
                <BrowserRouter>
                    <Switch>
                        <Route exact path={SITE_ROUTES.CLIENT.URL}>
                            <ClientPage/>
                        </Route>
                        <Route path={SITE_ROUTES.BUSINESS.URL}>
                            <BusinessPage/>
                        </Route>
                    </Switch>
                </BrowserRouter>
            </ThemeContext.Provider>
        </ToastContext.Provider>
    );
}

export default App;
