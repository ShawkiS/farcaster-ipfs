const parseKey = require('./lib/parseKey');
const { getPreviewCasts } = require('./farcaster.js');
const ejs = require('ejs');
const config = require('./config')

const username = config.username;

const loadIpfs = async () => {
  const { create } = await import('ipfs-http-client')

  const node = create('https://ipfs.infura.io:5001/api/v0')

  return node
}

exports.uploadToIpfs = async (obj) => {
  const ipfs = await loadIpfs();
  const result = ipfs.add(Buffer.from(JSON.stringify(obj)))
   .then(res => {
     return res.path;
  });

  return result;
}

exports.uploadPage = async (obj) => {
  const ipfs = await loadIpfs();
  const result = ipfs.add(Buffer.from(obj))
   .then(res => {
     return res.path;
  });

  return result;
}

exports.getCidsList = async (db) => {
  const ipfsLink = 'https://ipfs.io/ipfs/';
  
  const allKeys = await db.list().then(keys => {return keys});
  const filteredKeys = allKeys.filter(key => key.includes("ipfs"))  
  .sort((a, b) => b - a);
  const keyResults = [];
  
  for (let i = filteredKeys.length - 1; i >=0; i--) {
    const val = JSON.parse(await db.get(filteredKeys[i]));
     keyResults.push({
      key: new Date(parseKey(filteredKeys[i])).toString().split(' ').slice(0, 4).join(' '),
       directoryCid: val.directoryCid,
       pageCid: val.pageCid,
       directoryCidLink: `${ipfsLink}${val.directoryCid}`,
       pageCidLink: `${ipfsLink}${val.pageCid}`,

    })
  }

  return keyResults;
}

exports.generateHtmlPage = async () => {
  const casts = await getPreviewCasts();

    let html = '';
    
    ejs.renderFile('./views/casts.html', {casts: casts, username}, (err, result) => {
    if (err) {
        console.log('info', 'error:' + err);
    }
    else {
        try {
          html = result;
        } catch(err) {
            if (err) {
                throw err;
            }
        }

    }
});

  return html;

}