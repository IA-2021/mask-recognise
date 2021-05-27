'use strict';

const Utils = {
    extractDataFromDataURL(dataURL) {
        return dataURL.split('base64,')[1];
    },
    isPlural(cant) {
        return cant === 0 || cant > 1;
    },
    resultToHTML(result) {
        const { personas, conElemento, sinElemento, conElementoMalPuesto } =
            result;

        const persons = `Se detectaron ${personas} persona${
            Utils.isPlural(personas) ? 's' : ''
        }`;
        const withMask = `${conElemento} ${
            Utils.isPlural(conElemento) ? 'tienen' : 'tiene'
        } el barbijo puesto`;
        const withoutMask = `${sinElemento} no ${
            Utils.isPlural(sinElemento) ? 'tienen' : 'tiene'
        } el barbijo puesto`;
        const wrongMask = `${conElementoMalPuesto} ${
            Utils.isPlural(sinElemento) ? 'tienen' : 'tiene'
        } el barbijo mal puesto`;

        return `
            <ul>
                <li>${persons}</li>
                <li>${withMask}</li>
                <li>${withoutMask}</li>
                <li>${wrongMask}</li>
            </ul>
        `;
    },
    showElement(el) {
        el.classList.add('show');
    },
    hideElement(el) {
        el.classList.remove('show');
    },
};

const Loading = (function (selector) {
    const el = document.getElementById(selector);

    function show() {
        Utils.showElement(el);
    }

    function hide() {
        Utils.hideElement(el);
    }

    return {
        show,
        hide,
    };
})('loading');

const AWS = {
    API: 'https://qcej7s1g3l.execute-api.us-east-1.amazonaws.com/dev/api',

    async recognise(img) {
        Loading.show();

        const resp = await fetch(AWS.API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: img }),
        });

        Loading.hide();
        return resp.json();
    },
};

const Camera = (function (selector) {
    let stream = null;

    const el = document.getElementById(selector);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((_) => {
            stream = _;
            el.srcObject = stream;
        })
        .catch(function (err) {
            console.log(err.name + ': ' + err.message);
        });

    function capture() {
        context.drawImage(el, 0, 0, canvas.width, canvas.height);
        return Utils.extractDataFromDataURL(canvas.toDataURL('image/jpeg'));
    }

    function setFixedImg(img) {
        el.src = '';
        el.autoplay = false;
        el.setAttribute('poster', img);
    }

    function replay() {
        el.autoplay = true;
        el.srcObject = stream;
    }

    return {
        pause: () => el.pause(),
        play: () => el.play(),
        replay,
        setFixedImg,
        capture,
    };
})('camera');

const Dialog = (function (selector) {
    const el = document.getElementById(selector);
    const main = el.querySelector('main');
    let onAccept = null;

    el.querySelector('button').addEventListener('click', hide);

    function hide() {
        Utils.hideElement(el);
        if (onAccept) {
            onAccept();
            onAccept = null;
        }
    }

    function show(clb) {
        Utils.showElement(el);
        onAccept = clb;
    }

    function changeContent(html) {
        main.innerHTML = html;
    }

    return {
        show,
        hide,
        changeContent,
    };
})('dialog');

const FileManager = (function (selector) {
    const uploadButton = document.getElementById(selector);

    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/png, image/jpeg');

    function upload() {
        fileInput.value = '';
        fileInput.click();

        return new Promise((resolve) => {
            fileInput.addEventListener(
                'change',
                () => {
                    const uploadImg = fileInput.files[0];
                    const reader = new FileReader();

                    reader.addEventListener(
                        'load',
                        async function () {
                            resolve(reader.result);
                        },
                        false
                    );

                    reader.readAsDataURL(uploadImg);
                },
                { once: true }
            );
        });
    }

    return { upload };
})('upload');

const Nav = (function () {
    const captureButton = document.getElementById('capture');
    const uploadButton = document.getElementById('upload');

    captureButton.addEventListener('click', capture);
    uploadButton.addEventListener('click', upload);

    async function capture() {
        const imageData = Camera.capture();

        Camera.pause();
        const result = await AWS.recognise(imageData);

        Dialog.changeContent(Utils.resultToHTML(result));
        Dialog.show(Camera.play);
    }

    async function upload() {
        const img = await FileManager.upload();
        const imageData = Utils.extractDataFromDataURL(img);

        Camera.setFixedImg(img);
        const result = await AWS.recognise(imageData);

        Dialog.changeContent(Utils.resultToHTML(result));
        Dialog.show(Camera.replay);
    }
})();
