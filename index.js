// decrypt
const gpg = require("gpg");
const fs = require("fs");

const passphrase = "CCSM_DEV_TEST_KEY"

generate();
async function generate() {
    const argsArray = ["--passphrase", passphrase, "--decrypt"];
    gpg.callStreaming("./files/encrypted.txt", "./files/decrypted.txt", argsArray, (err) => {
        if (err)
        {
            console.log("err:"+ err)
        }
        console.log("done")
    });

    //Delete decrypted file after operation....
}
