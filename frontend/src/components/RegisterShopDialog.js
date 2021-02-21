import {box} from "tweetnacl";
import React from "react";
import {ToastContext} from "../context";
import {Dialog} from "primereact/dialog";
import {Formik} from "formik";
import {Shop} from "../api";
import db from "../db";
import {InputText} from "primereact/inputtext";
import classnames from "classnames";
import {encodeBase64} from "tweetnacl-util";
import {Button} from "primereact/button";
import PropTypes from 'prop-types';

export const RegisterShopDialog = ({visible = false, setVisible, reloadShopList, setShop}) => {
    const {publicKey, secretKey} = box.keyPair();
    const showMessage = React.useContext(ToastContext);
    return (
        <Dialog
            header='加入店舖'
            onHide={() => setVisible(false)}
            visible={visible}
        >
            <p>私隱模式下，你的客人資料將加密儲存在你的瀏覽器。你不能自行解密客人資料，除非你主動提供解鎖密碼予本網，否則本網即使取得你的客人資料，亦不能解密。</p>
            <p><b>請注意</b></p>
            <ul>
                <li>請你複製好解鎖密碼，並妥善保存，<b className='p-error'><u>解鎖密碼只會出現一次</u></b>，倘若遺失，即絕無可能解密客人資料。</li>
                <li>你不能手動清除瀏覽記錄，<b className='p-error'><u>否則將遺失所有客人資料</u></b>。若你有清除瀏覽記錄的習慣，
                    你可能需要下載另一個瀏覽器專門使用此網頁，或定期下載備份，以策安全。
                </li>
            </ul>
            <p>你的店舖名字將用於驗證解鎖資料請求。請小心填寫。</p>
            <Formik
                enableReinitialize
                initialValues={{name: '', copiedLogin: false, copiedDecrypt: false}}
                validate={values => {
                    const errors = {};
                    if (!values.name) {
                        errors.shopName = '必填';
                    }
                    if (!values.copiedLogin) {
                        errors.copiedLogin = '請按右方圖示複製登入密碼';
                    }
                    if (!values.copiedDecrypt) {
                        errors.copiedDecrypt = '請按右方圖示複製解鎖密碼';
                    }
                    return errors;
                }}
                onSubmit={(values, {setSubmitting}) => {
                    setSubmitting(true);
                    (async function() {
                        try {
                            const res = await Shop.registerShop(values.name, encodeBase64(publicKey));
                            if (res.status === 200) {
                                try {
                                    const newShop = {
                                        name: values.name,
                                        shopPubKey: encodeBase64(publicKey),
                                        serverPubKey: res.data
                                    }
                                    await db.table('shop').add(newShop);
                                    showMessage({severity: 'success', summary: '註冊成功', detail: `你現以${newShop.name}身份繼續`});
                                    await reloadShopList();
                                    setShop(newShop);
                                    setVisible(false);
                                } catch (error) {
                                    showMessage({severity: 'error', summary: '本地資料庫錯誤', detail: error.toString()});
                                }
                            }
                        } catch (error) {
                            if (error.response && [400, 409].indexOf(error.response.status) !== -1) {
                                showMessage({severity: 'error', summary: '加入失敗', detail: error.response.data});
                            } else if (error.request) {
                                showMessage({severity: 'error', summary: '加入失敗', detail: error.toString()});
                            } else {
                                showMessage({severity: 'error', summary: '不明錯誤', detail: '請回報到leavename@protonmail.com'});
                            }
                        } finally {
                            setSubmitting(false);
                        }
                    })()
                }}
            >
                {({values, errors, dirty, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isValid, isSubmitting}) => {
                    const renderError = (name) => touched[name] && errors[name] ?
                        <small className='p-error p-d-block'>{errors[name]}</small> : null;
                    return (
                        <form onSubmit={handleSubmit}>
                            <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>店舖名稱</span>
                                <InputText
                                    className={classnames('p-d-block', {'p-d-invalid': errors.name})}
                                    name='name'
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}/>
                            </div>
                            {renderError('name')}
                            <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>登入密碼</span>
                                <InputText id='initial-pubkey' value={encodeBase64(publicKey)}/>
                                <span className='p-inputgroup-addon'>
                                    <i className='pi pi-copy' onClick={() => {
                                        document.querySelector('#initial-pubkey').select();
                                        document.execCommand('copy');
                                        setFieldValue('copiedLogin', true);
                                    }}/>
                                </span>
                            </div>
                            {errors.copiedLogin ? <small className='p-error p-d-block'>{errors.copiedLogin}</small> : null}
                            <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>解鎖密碼</span>
                                <InputText id='initial-secretkey' value={encodeBase64(secretKey)}/>
                                <span className='p-inputgroup-addon'>
                                     <i className='pi pi-copy' onClick={() => {
                                         document.querySelector('#initial-secretkey').select();
                                         document.execCommand('copy');
                                         setFieldValue('copiedDecrypt', true);
                                     }}/>
                                </span>
                            </div>
                            {errors.copiedDecrypt ? <small className='p-error p-d-block'>{errors.copiedDecrypt}</small> : null}
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

RegisterShopDialog.propTypes = {
    visible: PropTypes.bool,
    setVisible: PropTypes.func,
    reloadShopList: PropTypes.func,
    setShop: PropTypes.func,
}