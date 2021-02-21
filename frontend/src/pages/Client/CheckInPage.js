import React from 'react'

import classnames from 'classnames';
import {Button} from 'primereact/button';
import {Dialog} from "primereact/dialog";
import {InputText} from 'primereact/inputtext';
import {Password} from "primereact/password";
import {Formik} from 'formik';
import QRCode from "react-qr-code";

import {ToastContext} from "../../context";
import {symmetricDecrypt, symmetricEncrypt} from '../../cryptography';
import {EM, QR_CODE_MAX_SIZE} from "../../constants";
import {TopMenuBar} from "../../components/TopMenuBar";

const saveCredential = (plaintext, password) => {
    if (!password) {
        localStorage.setItem('user', JSON.stringify({encrypted: false, data: btoa(plaintext)}));
    } else {
        const ciphertext = symmetricEncrypt(plaintext, password);
        localStorage.setItem('user', JSON.stringify({encrypted: true, data: btoa(ciphertext)}));
    }
}

export const CheckInPage = () => {
    const showMessage = React.useContext(ToastContext);
    const [promptVisible, setPromptVisible] = React.useState(false);
    const [initialValue, setInitialValue] = React.useState({name: '', phone: '', password: ''});
    const [savedCiphertext, setSavedCiphertext] = React.useState(null);
    const [password, setPassword] = React.useState('');
    const [qrCodeSize, setQrCodeSize] = React.useState(window.innerWidth < QR_CODE_MAX_SIZE
        ? window.innerWidth
        : QR_CODE_MAX_SIZE);

    React.useEffect(() => {
        const savedCredential = localStorage.getItem('user');
        if (savedCredential) {
            const b64encoded = JSON.parse(savedCredential);
            const decodedData = atob(b64encoded.data);
            if (!b64encoded.encrypted) {
                const {name, phone} = decodeCredential(decodedData);
                setInitialValue({name, phone});
            } else {
                setPromptVisible(true);
                setSavedCiphertext(decodedData);
            }
        }
        const resizeHandler = () => setQrCodeSize(window.innerWidth < QR_CODE_MAX_SIZE
            ? window.innerWidth
            : QR_CODE_MAX_SIZE);
        window.addEventListener('resize', resizeHandler)
        return () => window.removeEventListener('resize', resizeHandler);
    }, [])

    const encodeCredential = values => {
        return JSON.stringify({version: '1.0.0', name: encodeURIComponent(values.name), phone: values.phone})
    };

    const decodeCredential = string => {
        const {version, name, phone} = JSON.parse(string);
        return {version, name: decodeURIComponent(name), phone}
    }

    const renderDialogFooter = (
        <div>
            <Button
                label='移除記錄'
                icon='pi pi-trash'
                onClick={() => {
                    localStorage.removeItem('user');
                    setPromptVisible(false);
                }}
            />
            <Button
                label='繼續'
                icon='pi pi-check'
                autofocus
                onClick={() => {
                    const plaintext = symmetricDecrypt(savedCiphertext, password);
                    if (!plaintext) {
                        showMessage({severity: 'error', summary: '密碼錯誤', detail: '請再試一次，或移除記錄'});
                        return;
                    }
                    const {name, phone} = decodeCredential(plaintext);
                    setInitialValue({name, phone});
                    setPromptVisible(false);
                }}
            />
        </div>
    )

    return (
        <div>
            <TopMenuBar/>
            <div style={{margin: EM * 2, display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                <Dialog
                    header='輸入密碼'
                    footer={renderDialogFooter}
                    visible={promptVisible}
                    onHide={() => setPromptVisible(false)}>
                    <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                    <span className='p-inputgroup-addon'>
                        <i className='pi pi-lock'/>
                    </span>
                        <Password
                            placeholder='密碼'
                            onChange={({target: {value}}) => setPassword(value)}
                            feedback={false}
                            toggleMask/>
                    </div>
                </Dialog>
                <Formik
                    enableReinitialize
                    initialValues={initialValue}
                    validate={values => {
                        const errors = {};
                        if (!values.name) {
                            errors.name = '必填';
                        }
                        if (!values.phone) {
                            errors.phone = '必填';
                        } else if (!/^(\+?[0-9]{1,3}\s?)?[0-9]{8,13}$/i.test(values.phone)) {
                            errors.phone = '電話號碼錯誤';
                        }
                        return errors;
                    }}
                    onSubmit={values => {
                        saveCredential(encodeCredential(values), values.password);
                        showMessage({severity: 'success', detail: '儲存成功'})
                    }}
                >
                    {({values, errors, dirty, touched, handleChange, handleBlur, handleSubmit, isValid}) => {
                        const renderError = (name) => touched[name] && errors[name]
                            ? <small className='p-error p-d-block'>{errors[name]}</small>
                            : null;
                        return (
                            <form onSubmit={handleSubmit} style={{maxWidth: QR_CODE_MAX_SIZE}}>
                                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                    <QRCode
                                        bgColor='var(--surface-b)'
                                        fgColor='#000000'
                                        value={encodeCredential(values)}
                                        size={qrCodeSize - EM * 2}
                                    />
                                </div>
                                <div className='p-grid p-fluid'>
                                    <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>
                                    <i className='pi pi-user'/>
                                </span>
                                        <InputText
                                            className={classnames('p-d-block', {'p-d-invalid': errors.name})}
                                            placeholder='姓名'
                                            name='name'
                                            value={values.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}/>
                                    </div>
                                    {renderError('name')}
                                    <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>
                                    <i className='pi pi-phone'/>
                                </span>
                                        <InputText
                                            className={classnames('p-d-block', {'p-d-invalid': errors.phone})}
                                            name='phone'
                                            placeholder='電話號碼'
                                            value={values.phone}
                                            onChange={handleChange}
                                            onBlur={handleBlur}/>
                                    </div>
                                    {renderError('phone')}
                                    <div className='p-inputgroup' style={{margin: '0.5em 0'}}>
                                <span className='p-inputgroup-addon'>
                                    <i className='pi pi-lock'/>
                                </span>
                                        <Password
                                            name='password'
                                            placeholder='密碼 (可留空)'
                                            feedback={false}
                                            toggleMask
                                            onChange={handleChange}
                                            onBlur={handleBlur}/>
                                    </div>
                                    <Button
                                        type='submit'
                                        disabled={!dirty || !isValid}
                                        label={localStorage.getItem('user') ? '更新記錄' : '儲存'}/>
                                </div>
                            </form>
                        )
                    }}
                </Formik>
            </div>
        </div>

    )
}