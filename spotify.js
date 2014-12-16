var u       = require('underscore');
var config  = require('./config.json');
var spotify = require('node-spotify');
var exec    = require('child_process').exec;


// check root
var id = process.getuid();
if (id !== 0) {
  process.stderr.write('Must run as root\n');
  process.exit(1);
}

// check username and password existence
var username = config.login.username || process.argv[2];
var password = config.login.password || process.argv[3];

if (!username || !password) {
  process.stderr.write("Missing password or username\n");
  process.exit(1);
}

// configure node-spotify
spotify = spotify(config.spotifyOptions);

// utility function to exit properly 
function exit(code) {
  stopADCLoop = true;
  console.log('\nLogging out...');
  spotify.logout(function () {
    console.log('Bye.');
    process.exit(code || 0);
  });   
}

function readADC(callback) {
  exec('python ./readADC.py', function (err, stdout, stderr) {
    if (err) {
      process.stderr.write(err + '\n');
      exit(1);
    }
    var level = parseInt(stdout, 10);
    if (isNaN(level)) {
      level = 0;
    }
    callback(null, level);
  });
}

var stopADCLoop = false;
function readADCLoop() {
  readADC(function (err, level) {
    console.log(level);
    if (460 < level && level < 480) {
      if (paused) {
        console.log('magnet far, playing');
        togglePlayer();
      }
    } else {
      if (!paused) {
        console.log('magnet close, pausing');
        togglePlayer();
      }
    }
    if (!stopADCLoop) {
      setTimeout(readADCLoop, 200);
    }
  });
}
readADCLoop();

spotify.login(username, password, false, false);

var currentTrack;

// catch Ctrl-C and log out properly
process.on('SIGINT', function () {
  exit(0);
});

var paused = false;
function togglePlayer() {
  if (paused) {
    spotify.player.resume();
  } else {
    spotify.player.pause();
  }
  paused = !paused;
}

spotify.on({
  ready : function () {
    console.log('Ready');

    var playlists = spotify.playlistContainer.getPlaylists();
    var hamacPlaylist = u.findWhere(playlists, {name : config.playlist});

    setup(hamacPlaylist);
  },
  metadataUpdated : function () {
    console.log('metadataUpdated', arguments);
  },
  logout : function () {
    console.log('logout', arguments);
  }
});

spotify.internal.protos.Track.prototype.play = function () {
  console.log('Playing ' + this.name);
  spotify.player.play(this);
  paused = false;
};


spotify.internal.protos.Playlist.prototype.getRandomTrack = function (trackToAvoid) {
  var max = this.numTracks;
  var track;
  if (max === 0) {
    return;
  }
  if (max === 1) {
    return this.getTrack(0);
  }
  do {
    var index = Math.floor(Math.random() * max);
    track = this.getTrack(index);
  } while (trackToAvoid && track.link === trackToAvoid.link);
  return track;
};

spotify.internal.protos.Playlist.prototype.playRandom = function () {
  var nextTrack = this.getRandomTrack(currentTrack);
  nextTrack.play();
  currentTrack = nextTrack;
};

function logPlaylistInfo(playlist) {
  console.log('Playlist ' + playlist.name + ' has ' + playlist.numTracks + ' tracks.');
}

function onTracksAdded(err, playlist, tracks, position) {
  console.log(tracks.length + ' tracks added.');
  logPlaylistInfo(playlist);
}

function onTracksRemoved(err, playlist, trackIndices) {
  console.log(trackIndices.length + ' tracks removed.');
  logPlaylistInfo(playlist);
}

function setup(playlist) {
  logPlaylistInfo(playlist);

  function makeLogger(name) {
    return function log() {
      //console.log(name, arguments);
    };
  }

  playlist.on({
    playlistRenamed     : makeLogger('playlistRenamed'),
    tracksAdded         : onTracksAdded,
    tracksMoved         : makeLogger('tracksMoved'),
    tracksRemoved       : onTracksRemoved,
    trackCreatedChanged : makeLogger('trackCreatedChanged'),
    trackSeenChanged    : makeLogger('trackSeenChanged'),
    trackMessageChanged : makeLogger('trackMessageChanged')
  });

  spotify.player.on({
    endOfTrack : function () {
      playlist.playRandom();
    }
  });

  playlist.playRandom();
}
