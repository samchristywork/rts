const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const Game = require('./game');
const AIController = require('./ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const games = [];

const aiTypes = ['Passive', 'Normal', 'Aggressive'];

function getRandomAIType() {
  return aiTypes[Math.floor(Math.random() * aiTypes.length)];
}

for (let i = 0; i < 5; i++) {
  const ai1Type = getRandomAIType();
  const ai2Type = getRandomAIType();

  const game = new Game('map1', [`${ai1Type}-1`, `${ai2Type}-2`]);
  game.players[0].type = 'cpu';
  game.players[0].cpuType = ai1Type;
  game.players[0].name = ai1Type;
  game.players[1].type = 'cpu';
  game.players[1].cpuType = ai2Type;
  game.players[1].name = ai2Type;
  game.start();
  games.push(game);
}

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

io.on('connection', (socket) => {
  socket.on('action', (data) => {
    const game = games.find(g => g.id === data.gameId);
    if (game) {
      game.addAction(data.action);
    }
  });
});

setInterval(() => {
  games.forEach(game => {
    if (game.status === 'running') {
      game.players.forEach(player => {
        if (player.type === 'cpu') {
          AIController.runAI(game, player);
        }
      });
      game.simulate();
      io.emit(`game:${game.id}`, game);
    }
  });
}, 1000 / 30);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
