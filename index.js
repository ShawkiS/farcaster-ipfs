const express = require('express');
const bodyParser = require('body-parser');
const Database = require("@replit/database");
const parseKey = require('./lib/parseKey');
const {generatePkFromSeed, postCast} = require('./lib/cast');
const ejs = require('ejs');
const { update } = require('./update.js');
const { isThereNewCasts, getPreviewCasts } = require('./farcaster.js');
const { getCidsList, uploadPage } = require('./ipfs.js');

const app = express();
const db = new Database();

db.list().then(keys => {
  if(keys.length == 0) {
    update(db)
  }
});

app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const CIDs = await getCidsList(db);
    const user = req.header('x-replit-user-name');
    res.render('main', { ipfsCids: CIDs, user: user });
});

app.post('/cast', async (req, res) => {
  const user = req.header('x-replit-user-name');
  const cast = req.body.text;

  if (user) {
  const seedphrase = process.env['seed'];
  const pk = await generatePkFromSeed(seedphrase.toString());
  postCast(pk, cast);
}
    res.redirect('/');
    update(db);
});

app.get('/refresh', async (req, res) => {
    if(await isThereNewCasts(db)) {
        await update(db)
    }
    res.redirect('/');
  
});

app.listen(8080, () => {
  console.log('Server up!');
});