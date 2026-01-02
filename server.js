const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const games = [];

const initialGame = new Game('map1', ['player1']);
initialGame.start();
games.push(initialGame);

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/games', (req, res) => {
  res.json(games);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

app.post('/api/games/:id/action', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const action = req.body;
  game.addAction(action);

  res.json({ success: true });
});

setInterval(() => {
  games.forEach(game => {
    if (game.status === 'running') {
      game.simulate();
      io.emit(`game:${game.id}`, game);
    }
  });
}, 1000 / 30);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
