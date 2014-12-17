var u       = require('underscore');
var config  = require('./config.json');
var spotify = require('node-spotify');
var adc     = require('./adc');
var player  = require('./player');

// check root (required to access GPIOs)
var id = process.getuid();
if (id !== 0) {
  process.stderr.write('Must run as root\n');
  //process.exit(1);
}

// check username and password existence
var username = config.login.username || process.argv[2];
var password = config.login.password || process.argv[3];

if (!username || !password) {
  process.stderr.write('Missing password or username\n');
  process.exit(1);
}

// configure node-spotify
spotify = spotify(config.spotifyOptions);
// configure player
player = player(spotify);

// utility function to exit properly
function exit(code) {
  console.log('\nStopping ADC');
  adc.stop();
  console.log('Logging out...');
  spotify.logout(function () {
    console.log('Bye.');
    process.exit(code || 0);
  });
}

// catch Ctrl-C and exit properly
process.on('SIGINT', function () {
  exit(0);
});

// magnet handler
function onMagnetValue(err, level) {
  if (err) {
    process.stderr.write(err + '\n');
    return;
  }
  if (config.magnet.low < level && level < config.magnet.high) {
    if (player.isPaused()) {
      console.log('Magnet far', level);
      player.resume();
    }
  } else {
    if (!player.isPaused()) {
      console.log('Magnet close', level);
      player.pause();
    }
  }
}

spotify.on({
  ready : function () {
    var playlists = spotify.playlistContainer.getPlaylists();
    var hamacPlaylist = u.findWhere(playlists, {name : config.playlist});

    player.setPlaylist(hamacPlaylist);
    player.startRandomLoop();
    // start paused
    player.pause();
    // start the ADC, toggle the player (pause/resume) when the magnet moves
    adc.run(onMagnetValue);
  },
  metadataUpdated : function () {
  },
  logout : function () {
  }
});

// connect to spotify service
// it triggers everything else
spotify.login(username, password, false, false);
