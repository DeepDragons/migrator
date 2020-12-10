const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { BN, Long } = require('@zilliqa-js/util');

const node = 'https://api.zilliqa.com';

const maincontractFrom = 'zil1epndtz8lhv7lemwfrnadvwftmtaruclkdg6fee';
const maincontractTo = '';
const transition = 'GiveBirth';
const privateKey = process.env.KEY;

[{
  "vname": "dragons",
  "type": "List (Dragon)",
  "value": [
    {
      "constructor": "Dragon",
      "argtypes": [
        "Uint256",
        "ByStr20",
        "Uint32",
        "String",
        "Uint256",
        "Uint256"
      ],
      "arguments": [
        "2", //token_id
        "0x0Ebe43B507467b0F6B5E206Ad58b8A3fc5Ba0C19", // owner
        "1", // stage
        "https://res.cloudinary.com/dragonseth/image/upload/0_1535.png", // token_uri
        "68472021902440675240152540012429795118111927856965723433540267169483745008602", // token_gen_image
        "77700130301403230241121055224" // token_gen_battle
      ]
    }
  ]
}]

function getState(stage) {
  if (stage > 2) {
    return 2;
  }

  return stage;
};

function geturl(id, stage) {
  stage = getState(stage);
  return `https://res.cloudinary.com/dragonseth/image/upload/${stage}_${id}.png`;
}

async function main() {
  const zilliqa = new Zilliqa(node);
  const { result } = await zilliqa.blockchain.getSmartContractState(maincontractFrom);
  const {
    token_gen_battle,
    token_gen_image,
    token_owners,
    token_uris,
    tokens_owner_stage
  } = result;
  const gasLimit = Long.fromNumber(9000);
  const gasPrice = new BN('2000000000');
  const amount = new BN(0);
  const toAddr = maincontractTo;
  // const pubKey = zilliqa.wallet.defaultAccount.publicKey;

  const data = {
    _tag: transition,
    params: [{
      "vname": "dragons",
      "type": "List (Dragon)",
      "value": Object.keys(token_owners).map((tokenID) => (    {
        "constructor": "Dragon",
        "argtypes": [
          "Uint256",
          "ByStr20",
          "Uint32",
          "String",
          "Uint256",
          "Uint256"
        ],
        "arguments": [
          tokenID, //token_id
          token_owners[tokenID], // owner
          getState(tokens_owner_stage[token_owners[tokenID]][tokenID]), // stage
          geturl(tokenID, tokens_owner_stage[token_owners[tokenID]][tokenID]), // token_uri
          token_gen_battle[tokenID], // token_gen_image
          token_gen_image[tokenID] // token_gen_battle
        ]
      }))
    }]
  }
  // const { txParams } = await zilliqa.wallet.sign(zilTxData);
  // const tx = await zilliqa.provider.send(
  //   RPCMethod.CreateTransaction,
  //   txParams
  // );


  console.log(JSON.stringify(data, null, 4));
}

main();
