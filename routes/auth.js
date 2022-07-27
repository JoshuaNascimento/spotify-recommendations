// Routes and Auth.js
const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// App requests authorization and user login to confirm authorization
const router = express.Router();

router.get('/login', (req, res) => {
    res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    })}`);
});

// Recieve code from authorization and request access token and refresh token
router.get('/callback', async (req, res) => {
    const {code} = req.query;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const secret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
    const grant_type = 'authorization_code';

    const basicHeader = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const {data} = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
        grant_type,
        code,
        redirect_uri,
    }), {
        headers: {
            Authorization: `Basic ${basicHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const sessionJWTObject = {
        token: data.access_token,
    };

    req.session.jwt = jwt.sign(sessionJWTObject, process.env.JWT_SECRET_KEY)
    return res.redirect('/');
});

// Endpoints for later

/* 
current-session enpoint verifies the jtw-token that is inside of the session object
if this token is valid we send the contents to the client in the request
otherwise; we send false
*/
router.get('/current-session', (req, res) => {
    jwt.verify(req.session.jwt, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err || !decodedToken) {
            res.send(false);
        } else {
            res.send(decodedToken);
        }
    });
})

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect(
        `/`
    );
});

module.exports = router;