const {getAllCasts, getUserData} = require('./farcaster.js');
const {uploadToIpfs, uploadPage, generateHtmlPage} = require('./ipfs.js');
const axios = require('axios').default;

exports.update = async (db) => {
  const ipfsLink = 'https://ipfs.io/ipfs/';

  const user = await getUserData();
  
  const proof = await axios.get(user.body.proofUrl)
    .then(r => {return r.data})
    .catch(e => console.log("gm! no proof data."));
  
  const casts = await getAllCasts();
  await db.set("lastMerkleRoot", casts[0].merkleRoot);
  
  const castsIpfsCid = await uploadToIpfs(casts);

  if (proof) {
  const proofIpfsCid = await uploadToIpfs(proof);
  user.body.ipfsProofUrl = `${ipfsLink}${proofIpfsCid}`;;
  }
  
  user.ipfsAddressActivityUrl = `${ipfsLink}${castsIpfsCid}`;
  
  const ipfsHash = await uploadToIpfs(user);

  const htmlPage = await generateHtmlPage();
  const pageCid = await uploadPage(htmlPage)

    db.set(`ipfs:${new Date().valueOf()}`, JSON.stringify({
          directoryCid: ipfsHash,
          pageCid: pageCid
      }
    ))
  
}