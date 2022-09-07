// decrypt
const gpg = require("gpg-with-err-handling");
const fs = require("fs");

const passphrase = "CCSM_DEV_TEST_KEY"

generate();
async function generate() {
    const argsArray = ["--passphrase", passphrase, "--decrypt"];
    gpg.callStreaming("./files/encrypted.txt", "./files/decrypted.txt", argsArray, (error, data) => {
        console.log("done   " + data)
    });

    //Delete decrypted file after operation....
}
