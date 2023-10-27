from flask import Flask, request, jsonify
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import dsa
from cryptography.hazmat.primitives.asymmetric import rsa
import base64
import os
import json

app = Flask(__name__)

# Output location of received data - creates a new directory if not existing
dir_uploads = './log/'
port_webhook = 3000

authentication = False  # If True, authenticate the received webhook header's auth key.
webhook_auth_key = ""  # Authentication key

webhook_encryption = False  # If True, received webhook's data will be decrypted.
encryption_key = ""  # Webhook encryption key


# Decrypt data
def decrypt(data):
    try:
        masterKey = encryption_key.encode()
        salt = base64.b64decode(data)[:16]
        iv = base64.b64decode(data)[16:28]
        encrypted_data = base64.b64decode(data)[28:-16]
        tag = base64.b64decode(data)[-16:]

        # Derive the encryption key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA512(),
            iterations=1,
            salt=salt,
            length=32  # Key length should be 32 bytes (256 bits)
        )
        key = kdf.derive(masterKey)

        cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), None)
        decryptor = cipher.decryptor()
        plainText = decryptor.update(encrypted_data) + decryptor.finalize()

        # Print the decrypted plaintext
        result = json.loads(plainText)
        return result
    except Exception as e:
        return ''


@app.route('/')
def hello():
    return 'Hello, World!'

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        if authentication:
            if request.headers.get('Authorization') != webhook_auth_key:
                return '', 401

        req_data = request.json if not webhook_encryption else decrypt(request.json.get('data', ''))

        process_webhook_data(req_data)
        return '', 202
    except Exception as e:
        print(e)
        return '', 500

def log_helper_filename(filename):
    print(f'Created file: {filename}')
    return filename


def save_image(image_data, file_name, customerUuid):
    if image_data:
        # Check if the data URL contains the image extension
        extension = image_data.split("image/")[1].split(";base64,")[0] if "image/" in image_data else None
        if extension:
            image_data = image_data.split(";base64,")[1]
            with open(log_helper_filename(f'{dir_uploads}{customerUuid}-{file_name}.{extension}'), 'wb') as image_file:
                image_file.write(base64.b64decode(image_data))
        else:
            print(f"Error: No valid file extension found for {file_name}")

def save_mp4(video_data, file_name, customerUuid):
    if video_data:
        extension = video_data.split("video/")[1].split(";base64,")[0] if "video/" in video_data else None
        if extension:
            video_data = video_data.split(";base64,")[1]
            with open(log_helper_filename(f'{dir_uploads}{customerUuid}-{file_name}.{extension}'), 'wb') as video_file:
                video_file.write(base64.b64decode(video_data))
        else:
            print(f"Error: No valid file extension found for {file_name}")

def save_pdf(pdf_data, file_name, customerUuid):
    if pdf_data:
        # Check if the data URL contains the image extension
        extension = pdf_data.split("application/")[1].split(";base64,")[0] if "application/" in pdf_data else None
        if extension:
            pdf_data = pdf_data.split(";base64,")[1]
            with open(log_helper_filename(f'{dir_uploads}{customerUuid}-{file_name}.{extension}'), 'wb') as pdf_file:
                pdf_file.write(base64.b64decode(pdf_data))
        else:
            print(f"Error: No valid file extension found for {file_name}")

def process_webhook_data(data):
    print('Files have been accepted on datetime:')
    print(str(os.system("date")))
    if not os.path.exists(dir_uploads):
        print('Upload directory not found..')
        os.makedirs(dir_uploads)
        print(f'Directory created at: {dir_uploads}')

    with open(log_helper_filename(f'{dir_uploads}{data["customerUuid"]}.json'), 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2)

    frontImage = data["Document_Information"]["frontImage"] if ("Document_Information" in data and "frontImage" in data["Document_Information"]) else None
    if frontImage:
        save_image(frontImage, "frontImage", data["customerUuid"])

    backImage = data["Document_Information"]["backImage"] if ("Document_Information" in data and "backImage" in data["Document_Information"]) else None
    if backImage:
        save_image(backImage, "backImage", data["customerUuid"])

    selfie = data["Face_Information"]["selfie"] if ("Face_Information" in data and "selfie" in data["Face_Information"]) else None
    if selfie:
        save_image(selfie, "selfie", data["customerUuid"])

    addressImage = data["Address_Information"]["addressImage"] if ("Address_Information" in data and "addressImage" in data["Address_Information"]) else None
    if addressImage:
        save_image(addressImage, "addressImage", data["customerUuid"])


    driverLicenceFrontImage = data["AdditionalFields"]["driverLicenceFrontImage"] if ("AdditionalFields" in data and "driverLicenceFrontImage" in data["AdditionalFields"]) else None
    if driverLicenceFrontImage:
        save_image(driverLicenceFrontImage, "driverLicenceFrontImage", data["customerUuid"])

    driverLicenceBackImage = data["AdditionalFields"]["driverLicenceBackImage"] if ("AdditionalFields" in data and "driverLicenceBackImage" in data["AdditionalFields"]) else None
    if driverLicenceBackImage:
        save_image(driverLicenceBackImage, "driverLicenceBackImage", data["customerUuid"])

    residentialPermitFrontImage = data["AdditionalFields"]["residentialPermitFrontImage"] if ("AdditionalFields" in data and "residentialPermitFrontImage" in data["AdditionalFields"]) else None
    if residentialPermitFrontImage:
        save_image(residentialPermitFrontImage, "residentialPermitFrontImage", data["customerUuid"])

    residentialPermitBackImage = data["AdditionalFields"]["residentialPermitBackImage"] if ("AdditionalFields" in data and "residentialPermitBackImage" in data["AdditionalFields"]) else None
    if residentialPermitBackImage:
        save_image(residentialPermitBackImage, "residentialPermitBackImage", data["customerUuid"])

    PDF = data["AdditionalFields"]["PDF"] if ("AdditionalFields" in data and "PDF" in data["AdditionalFields"]) else None
    if PDF:
        save_pdf(PDF, "PDF", data["customerUuid"])

    liveImage = data["VideoCall_Information"]["liveImage"] if ("VideoCall_Information" in data and "liveImage" in data["VideoCall_Information"]) else None
    if liveImage:
        save_image(liveImage, "liveImage", data["customerUuid"])

    mergeRecording = data["VideoCall_Information"]["mergeRecording"] if ("VideoCall_Information" in data and "mergeRecording" in data["VideoCall_Information"]) else None
    if mergeRecording:
        save_mp4(mergeRecording, "mergeRecording", data["customerUuid"])

    customerRecording = data["VideoCall_Information"]["customerRecording"] if ("VideoCall_Information" in data and "customerRecording" in data["VideoCall_Information"]) else None
    if customerRecording:
        save_mp4(customerRecording, "customerRecording", data["customerUuid"])

    agentRecording = data["VideoCall_Information"]["agentRecording"] if ("VideoCall_Information" in data and "agentRecording" in data["VideoCall_Information"]) else None
    if agentRecording:
        save_mp4(agentRecording, "agentRecording", data["customerUuid"])

    print("Webhook Data Saved Successfully..")
    

if __name__ == '__main__':
    print()
    print(f'======== Webhook receiver listening to /webhook on port: {port_webhook} ========')
    print()
    app.run(debug=True, port=port_webhook)
