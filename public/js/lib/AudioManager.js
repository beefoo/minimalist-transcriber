class AudioManager {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.player = false;
    this.isLoading = false;
    this.$filename = $('.filename');
    this.$currentTime = $('.current-time');
    this.$totalTime = $('.total-time');
  }

  static formatSeconds(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    if (seconds >= 3600) return date.toISOString().substring(11, 19);
    return date.toISOString().substring(14, 19);
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

  onSoundLoad(file) {
    const { sound } = this;
    const seconds = sound.duration();
    const formattedTime = this.constructor.formatSeconds(seconds);
    this.$filename.text(file.name);
    this.$totalTime.text(formattedTime);
    this.$currentTime.text('00:00');
    this.isLoading = false;
  }
}
