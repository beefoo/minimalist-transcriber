class AudioManager {
  constructor(options = {}) {
    const defaults = {
      chunkSize: 5,
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.player = false;
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
    $('.previous').on('click', (e) => this.previousChunk());
    $('.next').on('click', (e) => this.nextChunk());

    $doc.on('keydown', (e) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case 'h':
          this.toggleAutopause();
          e.preventDefault();
          break;
        case 'j':
          this.previousChunk();
          e.preventDefault();
          break;
        case 'k':
          this.togglePlay();
          e.preventDefault();
          break;
        case 'l':
          this.nextChunk();
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
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = buffer;
        this.onSoundLoad(file);
      });
    });
    $filename.text('Loading file: 0% complete');
    reader.readAsArrayBuffer(file);
  }

  loadUI() {
    const { chunkSize } = this.options;
    const newPrevText = $('button.previous').first().attr('title').replace('5', chunkSize);
    const newNextText = $('button.next').first().attr('title').replace('5', chunkSize);
    $('.previous').attr('title', newPrevText);
    $('.next').attr('title', newNextText);
    $('.previous .visually-hidden').text(newPrevText);
    $('.next .visually-hidden').text(newNextText);
  }

  nextChunk() {
    const { audioSource } = this;
  }

  onSoundLoad(file) {
    const { audioSource } = this;
    const audioBuffer = audioSource.buffer;
    const seconds = audioBuffer.duration;
    const formattedTime = this.constructor.formatSeconds(seconds);
    this.$filename.text(file.name);
    this.$totalTime.text(formattedTime);
    this.$currentTime.text('00:00');
    this.isLoading = false;
  }

  previousChunk() {
    const { audioSource } = this;
    if (!audioSource || this.isLoading) return;
  }

  render(now) {
    window.requestAnimationFrame((time) => this.render(time));
  }

  toggleAutopause() {
    const { audioSource } = this;
    if (!audioSource || this.isLoading) return;

    this.isAutopause = !this.isAutopause;
  }

  togglePlay() {
    const { audioSource } = this;
    if (!audioSource || this.isLoading) return;
  }
}
