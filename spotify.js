var u       = require('underscore');
var config  = require('./config.json');
var spotify = require('node-spotify')(config.spotifyOptions);

var currentTrack;

// catch Ctrl-C and log out properly
process.on('SIGINT', function () {
  console.log('\nLogging out...');
  spotify.logout(function () {
    console.log('Bye.');
    process.exit();
  });
});

spotify.login(config.login.username, config.login.password, false, false);

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
