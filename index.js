const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));

const generateRandomToken = (length = 64) => {
    return crypto.randomBytes(length / 2).toString('hex');
};

app.get('/spotifydl', async (req, res) => {
    const spotifyUrl = req.query.url;

    if (!spotifyUrl) {
        return res.status(400).json({ error: 'Please provide a Spotify URL.' });
    }

    try {
        const metadataResponse = await axios.get(`https://spotisongdownloader.to/api/composer/spotify/xsingle_track.php?url=${encodeURIComponent(spotifyUrl)}`, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Referer': 'https://spotisongdownloader.to/?timestamp=1728691486258'
            }
        });

        if (metadataResponse.status === 200 && metadataResponse.data) {
            const trackData = metadataResponse.data;
            const song_name = trackData.song_name;
            const artist_name = trackData.artist;
            const token = generateRandomToken();

            const postData = new URLSearchParams({
                song_name: song_name,
                artist_name: artist_name,
                url: spotifyUrl,
                token: token
            });

            const downloadResponse = await axios.post('https://members.spotisongdownloader.com/api/composer/spotify/swd.php', postData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (downloadResponse.data.status === 'success') {
                return res.json({
                    status: true,
                    song_name: trackData.song_name,
                    artist: trackData.artist,
                    album: trackData.album_name,
                    duration: trackData.duration,
                    release_date: trackData.released,
                    artwork: trackData.img,
                    spotify_url: trackData.url,
                    download_link: downloadResponse.data.dlink
                });
            } else {
                return res.status(500).json({ error: 'Failed to retrieve the download link.' });
            }
        } else {
            return res.status(500).json({ error: 'Failed to retrieve metadata for download.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});