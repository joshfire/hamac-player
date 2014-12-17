module.exports = function (spotify) {

  var playlist;
  var paused;
  var currentTrack;

  function isPaused() {
    return paused;
  }

  function resume() {
    console.log('Resume');
    spotify.player.resume();
    paused = false;
  }

  function pause() {
    console.log('Pause');
    spotify.player.pause();
    paused = true;
  }

  function play(track) {
    console.log('Playing ' + track.name);
    spotify.player.play(track);
    currentTrack = track;
    paused = false;
  }

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


  function setPlaylist(pl) {
    playlist = pl;

    logPlaylistInfo(playlist);

    playlist.on({
      tracksAdded   : onTracksAdded,
      tracksRemoved : onTracksRemoved

      //playlistRenamed     : function () {},
      //tracksMoved         : function () {},
      //trackCreatedChanged : function () {},
      //trackSeenChanged    : function () {},
      //trackMessageChanged : function () {}
    });


  }

  function getRandomTrack(playlist, trackToAvoid) {
    var max = playlist.numTracks;
    var track;
    if (max === 0) {
      return;
    }
    if (max === 1) {
      return playlist.getTrack(0);
    }

    do {
      var index = Math.floor(Math.random() * max);
      track = playlist.getTrack(index);
    } while (trackToAvoid && track.link === trackToAvoid.link);

    return track;
  }

  function playRandom(playlist) {
    var trackToAvoid = currentTrack;
    var nextTrack = getRandomTrack(playlist, trackToAvoid);
    play(nextTrack);
  }

  function startRandomLoop() {
    spotify.player.on({
      endOfTrack : function () {
        playRandom(playlist);
      }
    });

    playRandom(playlist);
  }

  return {
    resume          : resume,
    pause           : pause,
    isPaused        : isPaused,
    setPlaylist     : setPlaylist,
    startRandomLoop : startRandomLoop
  };
};
