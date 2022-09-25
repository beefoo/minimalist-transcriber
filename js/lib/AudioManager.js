class AudioManager {
  constructor(options = {}) {
    const defaults = {
      skipLength: 5,
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.isLoading = false;
    this.$filename = $('.filename');
    this.$currentTime = $('.current-time');
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

  loadListeners() {
    const $doc = $(document);

    this.$toggleAutopause.on('click', (e) => this.toggleAutopause());
    this.$togglePlay.on('click', (e) => this.togglePlay());
    $('.previous').on('click', (e) => this.skipBack());
    $('.next').on('click', (e) => this.skipForward());

    $doc.on('keydown', (e) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case 'h':
          this.toggleAutopause();
          e.preventDefault();
          break;
        case 'j':
          this.skipBack();
          e.preventDefault();
          break;
        case 'k':
          this.togglePlay();
          e.preventDefault();
          break;
        case 'l':
          this.skipForward();
          e.preventDefault();
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
  }

  onAudioEnded() {
    this.isPlaying = false;
    this.audioContext.suspend();
  }

  onSoundLoad(file) {
    const seconds = this.audioBuffer.duration;
    const formattedTime = this.constructor.formatSeconds(seconds);
    this.currentTime = 0;
    this.isPlaying = false;
    this.$filename.text(file.name);
    this.$totalTime.text(formattedTime);
    this.$currentTime.text('00:00');
    this.isLoading = false;
    this.segmentCount = Math.ceil(seconds / this.options.skipLength);
    this.currentSegment = 0;
    this.offsetTime = 0;
  }

  render(now) {
    window.requestAnimationFrame((time) => this.render(time));

    if (this.isLoading || !this.isPlaying || this.startTime === undefined) return;

    const t = this.audioContext.currentTime - this.startTime + this.offsetTime;
    const formattedTime = this.constructor.formatSeconds(t);
    this.$currentTime.text(formattedTime);
  }

  skipBack() {
    const { audioBuffer } = this;
    if (!audioBuffer || this.isLoading) return;

    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
  }

  skipForward() {
    const { audioBuffer } = this;
    if (!audioBuffer || this.isLoading) return;

    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
  }

  toggleAutopause() {
    this.$toggleAutopause.toggleClass('active');
    this.isAutopause = this.$toggleAutopause.hasClass('active');
  }

  togglePlay() {
    const { audioBuffer, audioContext } = this;
    if (!audioBuffer || this.isLoading) return;

    if (this.audioSource) this.audioSource.stop();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) this.$togglePlay.addClass('active');
    else this.$togglePlay.removeClass('active');

    if (!this.isPlaying) {
      audioContext.suspend();
      return;
    }

    audioContext.resume();
    const audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);
    if (this.isAutopause) {
      audioSource.start(0, this.currentTime, this.options.skipLength);
    } else {
      audioSource.start(0, this.currentTime);
    }
    this.startTime = audioContext.currentTime;
    audioSource.onended = () => {
      this.onAudioEnded();
    };
    this.audioSource = audioSource;
  }
}
