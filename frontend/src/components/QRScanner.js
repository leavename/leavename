import React from 'react';

import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import jsQR from 'jsqr';
import PropTypes from 'prop-types';

import {ToastContext} from "../context";
import {CLIENT_VERSION} from "../constants";

const canvasRef = React.createRef();
const videoRef = React.createRef();

export const QRScanner = ({callback, disabled}) => {
    const [loading, setLoading] = React.useState(true);
    const [intervalID, setIntervalID] = React.useState(-1);
    const showMessage = React.useContext(ToastContext);
    const lastCode = React.useRef();

    React.useEffect(() => {
        const videoEl = videoRef.current;
        (async function() {
            const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
            try {
                videoEl.srcObject = stream;
                videoEl.setAttribute('playsinline', true);
                videoEl.play();
                setLoading(false);
            } catch (err) {
                showMessage({severity: 'error', summary: '相機載入錯誤', detail: '請再試一次'})
            }
        })()
        return () => {
            videoEl.pause();
            videoEl.srcObject = null;
        }
    }, [showMessage]);

    const drawLine = (begin, end, color) => {
        const canvasEl = canvasRef.current;
        const canvasContext = canvasEl.getContext('2d');
        canvasContext.beginPath();
        canvasContext.moveTo(begin.x, begin.y);
        canvasContext.lineTo(end.x, end.y);
        canvasContext.lineWidth = 4;
        canvasContext.strokeStyle = color;
        canvasContext.stroke();
    }

    const recognition = () => {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
            return;
        }
        const canvasContext = canvasEl.getContext('2d');
        canvasEl.height = videoEl.videoHeight;
        canvasEl.width = videoEl.videoWidth;
        canvasContext.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        const imageData = canvasContext.getImageData(0, 0, canvasEl.width, canvasEl.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
        });
        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#ff0000");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "ff0000");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "ff0000");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "ff0000");

            if (code.data !== lastCode.current) {
                const codeObj = JSON.parse(code.data);
                if (typeof codeObj === 'object') {
                    if (codeObj.version !== CLIENT_VERSION) {
                        showMessage({severity: 'info', summary: '版本錯誤', detail: '版本不匹配，請重新整理頁面'});
                    } else if (!codeObj.name || !codeObj.phone) {
                        showMessage({severity: 'info', summary: '資料錯誤', detail: '姓名或電話號碼為空'})
                    } else {
                        callback(code);
                    }
                } else {
                    showMessage({severity: 'info', detail: '二維碼格式錯誤'})
                }
                lastCode.current = code.data;
            }
        }
    }
    const titles = {
        loading: '相機載入中，請稍候...',
        ready: '請對準客人的二維碼，再按掃描',
    }
    const isScanning = intervalID !== -1;
    const toggleScan = () => {
        if (intervalID === -1) {
            const intervalID = setInterval(() => recognition(), 100);
            setIntervalID(intervalID);
            lastCode.current = null;
        }
    }

    const cancelScan = () => {
        if (intervalID !== -1) {
            clearInterval(intervalID);
            setIntervalID(-1);
            lastCode.current = null;
        }
    }
    return (
        <React.Fragment>
            <Card
                header={
                    <video
                        ref={videoRef}
                        id='camera-video'
                        style={{
                            borderRadius: '3px',
                            width: '100%',
                            height: window.innerHeight - 280,
                            objectFit: 'cover'
                        }}
                    />}
                title={<span style={{userSelect: 'none'}}>{loading ? titles.loading : titles.ready}</span>}
                footer={
                    <Button
                        disabled={disabled}
                        style={{width: '100%', userSelect: 'none'}}
                        label={isScanning ? '取消掃描' : '掃描'}
                        onTouchStart={toggleScan}
                        onTouchEnd={cancelScan}
                        onMouseDown={toggleScan}
                        onMouseUp={cancelScan}
                    />
                }
            >
            </Card>
            <canvas id='recognition-canvas' style={{display: 'none'}} ref={canvasRef}/>
        </React.Fragment>
    )
}

QRScanner.propTypes = {
    callback: PropTypes.func,
}

