// decrypt
const gpg = require("gpg-with-err-handling");
const fs = require("fs");
const { ShareServiceClient } = require("@azure/storage-file-share");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

main();
async function main() {
    console.log("Start     : ==========================================")
    //variables set in code
    const account = "<Storage Account Name>";
    const shareName = "<Fileshare Root Folder Name>"
    const directoryName = "<path/from/root/to/file/>";
    const vaultName = "<CCSM keyvault name>";
    //variables get from vault
    let SASToken = ""
    let passphrase = "";
    try{
        //Get secrets from vault
        const credential = new DefaultAzureCredential({managedIdentityClientId: "<aks-pool-client-id>"});
        const url = `https://${vaultName}.vault.azure.net`;
        const client = new SecretClient(url, credential);

        let secretName = "<ENCRYPTION_KEY_SECRET_NAME>";
        const latestSecret = await client.getSecret(secretName);
        passphrase = latestSecret.value;
        secretName = "<SAS_TOKEN_SECRET_NAME>";
        const latestSecret = await client.getSecret(secretName);
        SASToken = latestSecret.value;

        //List Share name
        serviceClient = new ShareServiceClient(
            `https://${account}.file.core.windows.net${SASToken}`
        );
        for await (const share of serviceClient.listShares()) {
            console.log(`- ${share.name}`);
        }

        //List directory/file in path
        const directoryClient = serviceClient.getShareClient(shareName).getDirectoryClient(directoryName);
        let dirIter = directoryClient.listFilesAndDirectories();
        i = 1;
        for await (const item of dirIter) {
            if (item.kind === "directory") {
                console.log(`${i} - directory\t: ${item.name}`);
            } else {
              console.log(`${i} - file\t: ${item.name}`);
            }
            i++;
        }

        //Download a file to temp folder
        console.log("Download: ==========================================");
        const fileClient = serviceClient
             .getShareClient(shareName)
             .getDirectoryClient(directoryName)
             .getFileClient(fileName);
        const downloadFileResponse = await fileClient.download();
        const content = await streamToBuffer(downloadFileResponse.readableStreamBody)
        fs.createWriteStream('<store location>').write(content);

        //Decryption
        const argsArray = ["--passphrase", passphrase, "--decrypt"];
        gpg.callStreaming("<store location>", "./tmp/decrypted.dat", argsArray, (error, data) => {
            console.log("done   " + data)
        });
        //File operation
        //Delete decrypted file after operation....
    } catch (e) {
        console.log(e);
    }
}
