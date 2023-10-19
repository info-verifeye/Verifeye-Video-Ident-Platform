const express = require('express');
const bodyParser = require("body-parser");
const fs = require('fs');
const CryptoJS = require("crypto-js");
const app = express();

// output location of received data - creates new if not existing
const dirUploads = './log/';
const portWebhook = 3000;

const authentication = false;   // If true, authenticate the received webhook header's auth key.
const webhook_auth_key = "";  // authentication key

const webhook_encryption = false; // If true, received webhook's data will be decrypt.
const encryption_key = "";  // webhook encryption key

/*
    decrypt data
*/
let decrypt = async (data) => {
    var bytes  = CryptoJS.AES.decrypt(data, encryption_key);
    let eVal = bytes.toString(CryptoJS.enc.Utf8)

    return await (eVal ? JSON.parse(eVal) : null);
}


app.use(bodyParser.urlencoded({
    extended: true
})); 

// note the overcompensated file size limits
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}));

app.all('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.post('/webhook', async (req, res, next) => {
    try {
        if(authentication){
            if(req.headers.authorization !== webhook_auth_key){
                res.status(401);
                return;
            }
        }

        let reqData = {};
        if(webhook_encryption){
            let data = req.body.data ? req.body.data : "";
            reqData = await decrypt(data);
        }else{
            reqData = req.body;
        }

        processWebhookData(reqData);
        res.status(202);
    }
    catch (error) {
        console.error(error);
        res.status(500);
    }
    finally {
        res.end();
    }
})

app.listen(portWebhook);

let logHelperFilename = (filename) => {
    console.log('created file: ' + filename);
    return filename;
}

let processWebhookData = (data) => {
    console.log('Files have been accepted on datetime:');
    console.log(Date());

    if (!fs.existsSync(dirUploads)){
        console.log('upload directory not found..');
        fs.mkdirSync(dirUploads);
        console.log('directory created at: ' + dirUploads);
    }

    fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '.json'), JSON.stringify(data, null, 2), 'utf8')

    if (data.Document_Information && data.Document_Information.frontImage) {
        let fileExt = data.Document_Information.frontImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-frontImage.'+fileExt), Buffer.from(data.Document_Information.frontImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.Document_Information && data.Document_Information.backImage) {
        let fileExt = data.Document_Information.backImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-backImage.'+fileExt), Buffer.from(data.Document_Information.backImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.Face_Information && data.Face_Information.selfie) {
        let fileExt = data.Face_Information.selfie.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-selfie.'+fileExt), Buffer.from(data.Face_Information.selfie.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.Address_Information && data.Address_Information.addressImage) {
        let fileExt = data.Address_Information.addressImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-addressImage.'+fileExt), Buffer.from(data.Address_Information.addressImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.AdditionalFields && data.AdditionalFields.driverLicenceFrontImage) {
        let fileExt = data.AdditionalFields.driverLicenceFrontImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-driverLicenceFrontImage.'+fileExt), Buffer.from(data.AdditionalFields.driverLicenceFrontImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.AdditionalFields && data.AdditionalFields.driverLicenceBackImage) {
        let fileExt = data.AdditionalFields.driverLicenceBackImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-driverLicenceBackImage.'+fileExt), Buffer.from(data.AdditionalFields.driverLicenceBackImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.AdditionalFields && data.AdditionalFields.residentialPermitFrontImage) {
        let fileExt = data.AdditionalFields.residentialPermitFrontImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-residentialPermitFrontImage.'+fileExt), Buffer.from(data.AdditionalFields.residentialPermitFrontImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.AdditionalFields && data.AdditionalFields.residentialPermitBackImage) {
        let fileExt = data.AdditionalFields.residentialPermitBackImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-residentialPermitBackImage.'+fileExt), Buffer.from(data.AdditionalFields.residentialPermitBackImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }



    if (data.VideoCall_Information && data.VideoCall_Information.liveImage) {
        let fileExt = data.VideoCall_Information.liveImage.match(/(image)(\/)(png|jpeg|jpg)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'png';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-liveImage.'+fileExt), Buffer.from(data.VideoCall_Information.liveImage.replace('data:image/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.VideoCall_Information && data.VideoCall_Information.mergeRecording) {
        let fileExt = data.VideoCall_Information.mergeRecording.match(/(video)(\/)(mp4)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'mp4';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-mergeRecording.'+fileExt), Buffer.from(data.VideoCall_Information.mergeRecording.replace('data:video/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.VideoCall_Information && data.VideoCall_Information.customerRecording) {
        let fileExt = data.VideoCall_Information.customerRecording.match(/(video)(\/)(mp4)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'mp4';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-customerRecording.'+fileExt), Buffer.from(data.VideoCall_Information.customerRecording.replace('data:video/'+fileExt+';base64,', ''), 'base64'));
    }

    if (data.VideoCall_Information && data.VideoCall_Information.agentRecording) {
        let fileExt = data.VideoCall_Information.agentRecording.match(/(video)(\/)(mp4)(\;)/)
            fileExt = fileExt && fileExt[3] ? fileExt[3] : 'mp4';
        fs.writeFileSync(logHelperFilename(dirUploads + data.customerUuid + '-agentRecording.'+fileExt), Buffer.from(data.VideoCall_Information.agentRecording.replace('data:video/'+fileExt+';base64,', ''), 'base64'));
    }

    console.log("Webhook Data Saved Successfully..");
}

console.log();
console.log("======== webhook receiver listening to /webhook port:" + portWebhook + " ========");
console.log();

