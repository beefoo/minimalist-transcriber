class AudioManager {
  constructor(options = {}) {
    const defaults = {
      padSegments: 0.25,
      skipLength: 5,
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.isLoading = false;
    this.$filename = $('.filename');
    this.$currentTime = $('.current-time');
    this.$progress = $('.progress');
    this.$totalTime = $('.total-time');
    this.$toggleAutopause = $('.toggle-autopause');
    this.$togglePlay = $('.toggle-play');
    this.isAutopause = true;
    this.loadUI();
    this.loadListeners();
  }

  static formatSeconds(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    if (seconds >= 3600) return date.toISOString().substring(11, 19);
    return date.toISOString().substring(14, 19);
  }

  getCurrentAudioTime() {
    if (!this.audioContext) return 0;
    if (!this.isPlaying || this.playedAt === false) return this.offsetTime;
    const elapsedTime = this.audioContext.currentTime - this.playedAt;
    return this.offsetTime + elapsedTime;
  }

  loadListeners() {
    const $doc = $(document);

    this.$toggleAutopause.on('click', (e) => this.toggleAutopause());
    this.$togglePlay.on('click', (e) => this.togglePlay());
    $('.previous').on('click', (e) => this.skipBack());
    $('.next').on('click', (e) => this.skipForward());

    $doc.on('keyup', (e) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.skipBack();
          break;
        case ' ':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.skipForward();
          break;
        default:
          break;
      }
    });
  }

  loadSoundFromFile(file) {
    if (this.isLoading) return;
    const { $filename } = this;
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.isLoading = true;
    const reader = new FileReader();
    reader.addEventListener('progress', (event) => {
      let progress = 0;
      if (event.total && event.loaded && event.loaded > 0 && event.total > 0) {
        progress = Math.round((event.loaded / event.total) * 100);
      }
      $filename.text(`Loading file: ${progress}% complete`);
    });
    reader.addEventListener('load', () => {
      $filename.text('Processing file...');
      const audioData = reader.result;
      this.audioContext.decodeAudioData(audioData).then((buffer) => {
        this.audioBuffer = buffer;
        this.onSoundLoad(file);
      });
    });
    $filename.text('Loading file: 0% complete');
    reader.readAsArrayBuffer(file);
  }

  loadUI() {
    const { skipLength } = this.options;
    const newPrevText = $('button.previous').first().attr('title').replace('5', skipLength);
    const newNextText = $('button.next').first().attr('title').replace('5', skipLength);
    $('.previous').attr('title', newPrevText);
    $('.next').attr('title', newNextText);
    $('.previous .visually-hidden').text(newPrevText);
    $('.next .visually-hidden').text(newNextText);
    this.render();
  }

  onAudioEnded() {
    this.pause();
  }

  onSoundLoad(file) {
    const seconds = this.audioBuffer.duration;
    const formattedTime = this.constructor.formatSeconds(seconds);
    this.duration = seconds;
    this.isPlaying = false;
    this.$filename.text(file.name);
    this.$totalTime.text(formattedTime);
    this.$currentTime.text('00:00');
    this.isLoading = false;
    this.segmentCount = Math.max(Math.floor(seconds / this.options.skipLength), 1);
    this.currentSegment = 0;
    this.offsetTime = 0;
    this.playedAt = false;
    this.startedAt = false;
  }

  pause() {
    // update state
    this.offsetTime = this.getCurrentAudioTime();
    if (this.offsetTime >= this.duration) this.offsetTime = 0;
    this.isPlaying = false;

    // stop currently playing audio
    this.stopCurrentAudioSource();

    // suspend time
    this.audioContext.suspend();

    // update UI
    this.$togglePlay.removeClass('active');
  }

  play() {
    const { audioBuffer, audioContext, options } = this;

    // stop currently playing audio
    this.stopCurrentAudioSource();

    // create and connect a new audio source
    const audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);

    // resume time
    if (audioContext.state !== 'running') audioContext.resume();
    const { currentTime } = audioContext;

    // start new audio source
    if (this.isAutopause) {
      this.offsetTime = this.currentSegment * options.skipLength;
      const offset = Math.max(this.offsetTime - options.padSegments, 0);
      const maxDur = this.duration - offset;
      let dur = Math.min(options.skipLength + options.padSegments * 2, maxDur);
      if (this.currentSegment === this.segmentCount - 1) {
        dur = this.duration - offset;
      }
      audioSource.start(0, offset, dur);
    } else {
      audioSource.start(0, this.offsetTime);
    }

    // listen for end
    audioSource.onended = () => {
      this.onAudioEnded();
    };

    // update state
    this.playedAt = currentTime;
    if (this.startedAt === false) this.startedAt = currentTime;
    this.audioSource = audioSource;
    this.isPlaying = true;

    // update UI
    this.$togglePlay.addClass('active');
  }

  render() {
    window.requestAnimationFrame((time) => this.render());

    if (this.isLoading || !this.isPlaying) return;

    this.renderTime();
  }

  renderTime() {
    const t = this.getCurrentAudioTime();
    const formattedTime = this.constructor.formatSeconds(t);
    this.$currentTime.text(formattedTime);
    const progress = MathUtil.clamp(t / this.duration, 0, 1);
    this.$progress.css('transform', `scale3d(${progress}, 1, 1)`);
  }

  skipBack() {
    const { audioBuffer, options } = this;
    if (!audioBuffer || this.isLoading) return;

    if (this.isAutopause) {
      this.currentSegment = Math.max(this.currentSegment - 1, 0);
      this.offsetTime = this.currentSegment * options.skipLength;
    } else {
      this.offsetTime = Math.max(this.getCurrentAudioTime() - options.skipLength, 0);
    }

    if (this.isPlaying) this.play();
    else this.renderTime();
  }

  skipForward() {
    const { audioBuffer, options } = this;
    if (!audioBuffer || this.isLoading) return;

    if (this.isAutopause) {
      this.currentSegment = Math.min(this.currentSegment + 1, this.segmentCount - 1);
      this.offsetTime = this.currentSegment * options.skipLength;
    } else {
      this.offsetTime = Math.min(this.getCurrentAudioTime() + options.skipLength, this.duration);
      if (this.offsetTime >= this.duration) {
        this.pause();
      }
    }

    if (this.isPlaying) this.play();
    else this.renderTime();
  }

  stopCurrentAudioSource() {
    if (!this.audioSource) return;

    this.audioSource.onended = null;
    this.audioSource.stop();
    this.audioSource.disconnect(this.audioContext.destination);
    this.audioSource = false;
  }

  toggleAutopause() {
    const t = this.getCurrentAudioTime();
    const wasPlaying = this.isPlaying;

    // update UI
    this.$toggleAutopause.toggleClass('active');

    // pause current audio
    this.pause();

    // update state
    this.isAutopause = this.$toggleAutopause.hasClass('active');
    if (this.isAutopause) {
      this.currentSegment = Math.floor(t / this.options.skipLength);
      this.offsetTime = this.currentSegment * this.options.skipLength;
    } else {
      this.offsetTime = t;
    }

    // continue playing if was playing
    if (wasPlaying) this.play();
  }

  togglePlay() {
    if (!this.audioBuffer || this.isLoading) return;
    this.isPlaying = !this.isPlaying;

    if (!this.isPlaying) {
      this.pause();
      return;
    }

    this.play();
  }
}
