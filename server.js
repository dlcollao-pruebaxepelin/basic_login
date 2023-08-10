const express = require('express');
const {OAuth2Client} = require('google-auth-library');
const axios = require('axios');
const session = require('express-session');

const app = express();
const PORT = 3000;

const CLIENT_ID = '755315058303-g2tb0ln9plboq72pmcqtnko3qfvt4n7e.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URL = 'http://localhost:3000/oauth2callback';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

app.use(express.static('views'));
app.use(express.static('./'));
app.use(session({
    secret: 'xepelinprueba',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

async function findRowById(idOp) {
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/13-iqTPivUxFAsBGlI3AIoUKWo6U6fxKl0J3Ohe0vPJ0/values/Hoja%201`;
    try {
        const response = await axios.get(sheetsUrl, {
            headers: {
                'Authorization': `Bearer ${oAuth2Client.credentials.access_token}`
            }
        });

        const rows = response.data.values;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] == idOp) { // Suponiendo que idOp es la primera columna
                return i + 1; // Las filas en Sheets empiezan desde 1, no desde 0
            }
        }
        throw new Error("Row not found");

    } catch(err) {
        throw new Error("Error fetching data from Google Sheets or processing it.");
    }
}


app.get('/auth', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(authorizeUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const {code} = req.query;

  try {
    const {tokens} = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    req.session.tokens = tokens;
    res.redirect('/sheet-view');
  } catch (error) {
    res.send('Error retrieving access token: ' + error.message);
  }
});

app.get('/sheetdata', async (req, res) => {

  try {
    const sheetsUrl = 'https://sheets.googleapis.com/v4/spreadsheets/13-iqTPivUxFAsBGlI3AIoUKWo6U6fxKl0J3Ohe0vPJ0';
    
    const response = await axios.get(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${oAuth2Client.credentials.access_token}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.send('Error getting data from Google Sheets: ' + error.message);
  }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

app.get('/sheet-view', (req, res) => {
    res.sendFile(__dirname + '/views/sheetview.html');
});

app.post('/updateSheet', express.json(), async (req, res) => {
    const { idOp, tasa } = req.body;
    const tokens = req.session.tokens;
    if (tokens) {
        oAuth2Client.setCredentials(tokens)
    }
    try {
        const rowNumber = await findRowById(idOp);

        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/13-iqTPivUxFAsBGlI3AIoUKWo6U6fxKl0J3Ohe0vPJ0/values/Hoja%201!B${rowNumber}:B${rowNumber}?valueInputOption=RAW`;
        const response = await axios.put(sheetsUrl, {
            majorDimension: "ROWS",
            values: [[tasa]]
        }, {
            headers: {
                'Authorization': `Bearer ${oAuth2Client.credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            res.json({ success: true });
        } else {
            throw new Error("Update failed");
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
