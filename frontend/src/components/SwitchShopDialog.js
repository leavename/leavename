import React from "react";
import {ToastContext} from "../context";
import {Dialog} from "primereact/dialog";
import {Formik} from "formik";
import {Shop} from "../api";
import db from "../db";
import {InputText} from "primereact/inputtext";
import classnames from "classnames";
import {Button} from "primereact/button";
import PropTypes from "prop-types";

export const SwitchShopDialog = ({visible = false, setVisible, reloadShopList, setShop}) => {
    const showMessage = React.useContext(ToastContext);
    return (
        <Dialog
            header='加入店舖'
            onHide={() => setVisible(false)}
            visible={visible}
        >
            <Formik
                enableReinitialize
                initialValues={{shopPubKey: ''}}
                validate={values => {
                    const errors = {};
                    if (!values.shopPubKey) {
                        errors.shopPubKey = '必填';
                    } else if (values.shopPubKey.length !== 44) {
                        errors.shopPubKey = '登入密碼不正確 '
                    }
                    return errors;
                }}
                onSubmit={(values, {setSubmitting}) => {
                    setSubmitting(true);
                    (async function() {
                        try {
                            const {data: newShop} = await Shop.findShopName(values.shopPubKey);
                            try {
                                await db.table('shop').add(newShop);
                                showMessage({severity: 'success', summary: '加入成功', detail: `已加入${newShop.name}`});
                                await reloadShopList();
                                setShop(newShop);
                                setVisible(false)
                            } catch (error) {
                                showMessage({severity: 'error', summary: '本地資料庫錯誤', detail: '店舖已存在'});
                            }
                        } catch (error) {
                            if (error.response && error.response.status === 404) {
                                showMessage({severity: 'error', summary: '加入失敗', detail: '店舖不存在'})
                            } else if (error.request) {
                                showMessage({severity: 'error', summary: '加入失敗', detail: error.toString()});
                            } else {
                                showMessage({severity: 'error', summary: '不明錯誤', detail: '請回報到leavename@protonmail.com'});
                            }
                        } finally {
                            setSubmitting(false);
                        }
                    })();
                }}
            >
                {({values, errors, dirty, touched, handleChange, handleBlur, handleSubmit, isValid, isSubmitting}) => {
                    const renderError = (name) => touched[name] && errors[name] ?
                        <small className='p-error p-d-block'>{errors[name]}</small> : null;
                    return (
                        <form onSubmit={handleSubmit}>
                            <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>登入密碼</span>
                                <InputText
                                    id='pubkey-input'
                                    className={classnames('p-d-block', {'p-d-invalid': errors.shopPubKey})}
                                    name='shopPubKey'
                                    value={values.shopPubKey}
                                    onChange={handleChange}
                                    onBlur={handleBlur}/>
                            </div>

                            {renderError('shopPubKey')}
                            <div style={{
                                marginTop: '1em',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'flex-end'
                            }}>
                                <Button disabled={!isValid || isSubmitting} label='確認'/>
                            </div>
                        </form>
                    )
                }}
            </Formik>
        </Dialog>
    )
}

SwitchShopDialog.propTypes = {
    visible: PropTypes.bool,
    setVisible: PropTypes.func,
    reloadShopList: PropTypes.func,
    setShop: PropTypes.func,
}