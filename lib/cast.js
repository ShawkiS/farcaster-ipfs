const { Wallet } = require("@ethersproject/wallet");
const axios = require('axios').default;
const ethers = require('ethers');
const { getAllCasts } = require('../farcaster.js');
const { keccak256 } = require("@ethersproject/keccak256");
const { toUtf8Bytes } = require("@ethersproject/strings");
const didJWT = require('did-jwt')
const { publishCast } = require("@standard-crypto/farcaster-js");

exports.generatePkFromSeed = async (seed) => {
  return ethers.Wallet.fromMnemonic(seed, `m/44'/60'/0'/0/1230940800`).privateKey;
}

exports.postCast = async (privateKey, text) => {
    const signer = new Wallet(privateKey);
    const casts = await getAllCasts();
    const lastCast = casts[0];
    
   const unsignedCast = {
      type: 'text-short',
      publishedAt: Date.now(),
      sequence: lastCast.body.sequence + 1,
      username: 'shawki',
      address: lastCast.body.address,
      data: {
        text: text,
      },
      prevMerkleRoot: lastCast.merkleRoot,
   }
 
  const serializedCast = 
    JSON.stringify({
    type: unsignedCast.type,
    publishedAt: unsignedCast.publishedAt,
    sequence: unsignedCast.sequence,
    username: unsignedCast.username,
    address: unsignedCast.address,
    data: {
      text: unsignedCast.data.text,
      replyParentMerkleRoot: unsignedCast.data.replyParentMerkleRoot,
    },
    prevMerkleRoot: unsignedCast.prevMerkleRoot,
    tokenCommunities: unsignedCast.tokenCommunities,
  })
    
  const merkleRoot = keccak256(toUtf8Bytes(serializedCast));

  const signedCast = {
      body: unsignedCast,
      merkleRoot,
      signature: await signer.signMessage(merkleRoot),
    };

    const jwt = await didJWT.createJWT(
      { exp: Math.floor(Date.now() / 1000) + 60 },
      {
        issuer: `did:ethr:rinkeby:${lastCast.body.address}`,
        signer: didJWT.ES256KSigner(didJWT.hexToBytes(privateKey)),
      },
      { alg: "ES256K" }
    );
  
    const headers = {
      authorization: `Bearer ${jwt}`,
    };
  
  const result = await axios.post("https://guardian.farcaster.xyz/indexer/activity", signedCast, {
    headers: headers
  }).catch(e => console.log(e));
};

