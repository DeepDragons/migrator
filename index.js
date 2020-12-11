const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { BN, bytes, Long } = require('@zilliqa-js/util');
const { RPCMethod } = require('@zilliqa-js/core');
const { fromBech32Address } = require('@zilliqa-js/crypto');
const _ = require('lodash');

const node = 'https://api.zilliqa.com';
const MSG_VERSION = 1;
const maincontractFrom = fromBech32Address('zil1epndtz8lhv7lemwfrnadvwftmtaruclkdg6fee');
const maincontractTo = fromBech32Address('zil1t3xf4738gggt95zg3d0g4d96s6d6zzare6kcue');
const transition = 'GiveBirth';
const privateKey = process.env.KEY;

function sleap(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), value);
  }, []);
}

function getState(stage) {
  if (Number(stage) > 1) {
    return '1';
  }

  return String(stage);
};

function geturl(id, stage) {
  stage = getState(stage);
  return `https://res.cloudinary.com/dragonseth/image/upload/${stage}_${id}.png`;
}

async function getContract() {
  const zilliqa = new Zilliqa(node);
  const { result } = await zilliqa.blockchain.getSmartContractState(maincontractFrom);

  return result;
}

async function main() {
  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const {
    token_gen_battle,
    token_gen_image,
    token_owners,
    tokens_owner_stage
  } = await getContract();
  const netID = await zilliqa.network.GetNetworkId();
  const version = bytes.pack(netID.result, MSG_VERSION);
  const gasLimit = Long.fromNumber(9000);
  const gasPrice = new BN('2000000000');
  const amount = new BN(0);
  const toAddr = maincontractTo;
  const values = Object.keys(token_owners).map((tokenID) => ({
    constructor: 'Dragon',
    argtypes: [],
    arguments: [
      tokenID, //token_id
      String(token_owners[tokenID]).toLowerCase(), // owner
      getState(tokens_owner_stage[token_owners[tokenID]][tokenID]), // stage
      geturl(tokenID, tokens_owner_stage[token_owners[tokenID]][tokenID]), // token_uri
      token_gen_battle[tokenID], // token_gen_image
      token_gen_image[tokenID] // token_gen_battle
    ]
  }));
  zilliqa.wallet.addByPrivateKey(privateKey);
  const chunks = _.chunk(values, 1);
  const balance = await zilliqa.blockchain.getBalance(zilliqa.wallet.defaultAccount.address);
  let nonce = balance.result.nonce;
  const pubKey = zilliqa.wallet.defaultAccount.publicKey;

  for (let index = 0; index < chunks.length; index++) {
    nonce++;

    const chunk = chunks[index];
    const data = JSON.stringify({
      _tag: transition,
      params: [{
        vname: 'dragons',
        type: 'List (Dragon)',
        value: chunk
      }]
    });

    const zilTxData = zilliqa.transactions.new({
      data,
      nonce,
      version,
      amount,
      gasPrice,
      gasLimit,
      toAddr,
      pubKey
    });
    const { txParams } = await zilliqa.wallet.sign(zilTxData);
    const tx = await zilliqa.provider.send(
      RPCMethod.CreateTransaction,
      txParams
    );

    console.log(JSON.stringify(tx, null, 4));
    break;
  }
}

main();
