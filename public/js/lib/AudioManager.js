class AudioManager {
  constructor(options = {}) {
    const defaults = {
      chunkSize: 6,
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
    this.isLoading = true;
    const extension = file.name.split('.').pop().toLowerCase();
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
      const data = reader.result;
      this.player = new Howl({
        src: data,
        format: extension,
        onload: () => this.onSoundLoad(file),
      });
    });
    $filename.text('Loading file: 0% complete');
    reader.readAsDataURL(file);
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
    const { player } = this;
    if (!player || this.isLoading) return;

    this.currentIndex += 1;
    if (this.currentIndex >= this.chunks) {
      this.currentIndex = this.chunks - 1;
      return;
    }

    Howler.stop();
    this.currentId = this.player.play(String(this.currentIndex));
  }

  onSoundLoad(file) {
    const { player } = this;
    const { chunkSize } = this.options;
    const seconds = player.duration();
    const formattedTime = this.constructor.formatSeconds(seconds);
    this.$filename.text(file.name);
    this.$totalTime.text(formattedTime);
    this.$currentTime.text('00:00');
    const sprites = {};
    let total = seconds;
    let index = 0;
    do {
      const start = index * chunkSize * 1000;
      const dur = Math.floor(Math.min(chunkSize, total) * 1000);
      sprites[String(index)] = [start, dur];
      index += 1;
      total -= chunkSize;
    } while (total > 0);
    _.each(sprites, (sprite, key) => {
      // eslint-disable-next-line no-underscore-dangle
      player._sprite[key] = sprite;
    });
    this.chunks = index;
    this.currentIndex = 0;
    this.currentId = false;
    this.isLoading = false;
  }

  previousChunk() {
    const { player } = this;
    if (!player || this.isLoading) return;

    this.currentIndex -= 1;
    if (this.currentIndex < 0) {
      this.currentIndex = 0;
      return;
    }

    Howler.stop();
    this.currentId = this.player.play(String(this.currentIndex));
  }

  toggleAutopause() {
    const { player } = this;
    if (!player || this.isLoading) return;

    this.isAutopause = !this.isAutopause;
  }

  togglePlay() {
    const { player } = this;
    if (!player || this.isLoading) return;
    if (this.currentId !== false && player.playing(this.currentId)) {
      player.stop(this.currentId);
      return;
    }
    player.play(String(this.currentIndex));
  }
}
