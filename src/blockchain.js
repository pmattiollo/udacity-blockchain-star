/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        console.log("getChainHeight invoked");

        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        console.log("_addBlock invoked");

        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                if (self.height > 0) {
                    block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                }

                block.height = self.chain.length;
                block.time = new Date().getTime().toString().slice(0,-3);
                block.hash = SHA256(JSON.stringify(block)).toString();

                const errors = await self.validateChain();

                if (errors.length === 0) {
                    self.chain.push(block);
                    self.height = self.chain.length;

                    console.log("Block added: ", block);
                    resolve(block)
                } else {
                    console.log("Block could not be added due some error(s) in the chain: ", errors);
                    reject(errors);
                }
            } catch (error) {
                console.log("Block could not be added: ", error);
                reject("Something went wrong, block could not be added");
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        console.log("requestMessageOwnershipVerification invoked");

        return new Promise((resolve) => {
            const message = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;

            console.log("Message constructed: ", message);

            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        console.log("submitStar invoked");

        let self = this;
        return new Promise( (resolve, reject) => {
            const time = parseInt(message.split(':')[1]);
            const currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            const timeDiff = currentTime - time;
            const fiveMinutes = 5 * 60;

            if (timeDiff < fiveMinutes) {
                if (bitcoinMessage.verify(message, address, signature)) {
                    const block = new BlockClass.Block({"owner": address, "star": star});
                    self._addBlock(block);
                    resolve(block);
                } else {
                    console.log(`Verification of the (message: ${message}, address: ${address}, signature: ${signature}) did not pass`);
                    reject(Error("Verification of the message, address and signature did not pass"));
                }
            } else {
                console.log(`Time elapsed from the request ownership is ${timeDiff} milliseconds, therefore less than 5 minutes`);
                reject(Error("Time elapsed from the request ownership in bigger then 5 minutes"));
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        console.log("getBlockByHash invoked");

        let self = this;
        return new Promise((resolve, reject) => {
           const block = self.chain.find(value => value.hash === hash);

           if (block) {
               console.log(`Block with hash ${hash} found: `, block);
               resolve(block);
           } else {
               console.log(`Block with hash ${hash} not found`);
               resolve(null);
           }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        console.log("getBlockByHeight invoked");

        let self = this;
        return new Promise((resolve, reject) => {
            const block = self.chain.find(value => value.height === height);

            if (block) {
                console.log(`getBlockByHash invoked, block with height ${height} found: `, block);
                resolve(block);
            } else {
                console.log(`getBlockByHeight invoked, block with height ${height} not found`);
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        console.log("getStarsByWalletAddress invoked");

        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach(async value => {
                const blockData = await value.getBData();

                if (blockData && blockData.owner === address) {
                    stars.push(blockData);
                }
            });

            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        console.log("validateChain invoked");

        let self = this;
        let errorLog = [];
        return new Promise( (resolve, reject) => {
            try {
                self.chain.forEach(async block => {
                    const valid = await block.validate();

                    if (!valid) {
                        const errorMessage = `Block ${block.height} is invalid`;
                        console.log(errorMessage);
                        errorLog.push(errorMessage);
                    } else if(valid instanceof Error) {
                        console.log("Error returned by the block's validate function: ", valid);
                        errorLog.push(valid.message)
                    }

                    if (block.height > 0) {
                        const previousBlock = self.chain[block.height - 1];

                        if (block.previousBlockHash !== previousBlock.hash) {
                            const errorMessage = `Block ${block.height} expected previousBlockHash was ${previousBlock.hash}, but actual set to ${block.previousBlockHash}`;
                            console.log(errorMessage);
                            errorLog.push(errorMessage);
                        }
                    }
                });

                resolve(errorLog);
            } catch(error) {
                console.log("Error while validating the chain: ", error);
                reject(Error("Error while validating the chain"))
            }
        });
    }

}

module.exports.Blockchain = Blockchain;   