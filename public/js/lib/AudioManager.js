class AudioManager {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.sound = false;
    this.loadListeners();
  }

  static formatSeconds(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    if (seconds >= 3600) return date.toISOString().substring(11, 19);
    return date.toISOString().substring(14, 19);
  }

  loadListeners() {
    $('#fileinput').on('change', (e) => this.onFileInput(e));
  }

  onFileInput(event) {
    const el = event.currentTarget;
    if (!el.files || el.files.length <= 0) return;

    const [file] = el.files;
    const extension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const data = reader.result;
      this.sound = new Howl({
        src: data,
        format: extension,
        onload: () => this.onSoundLoad(file),
      });
    });
    $('.filename').text('Loading file...');
    reader.readAsDataURL(file);
  }

  onSoundLoad(file) {
    const { sound } = this;
    const seconds = sound.duration();
    const formattedTime = this.constructor.formatSeconds(seconds);
    $('.filename').text(file.name);
    $('.total-time').text(formattedTime);
    $('.current-time').text('00:00');
  }
}
