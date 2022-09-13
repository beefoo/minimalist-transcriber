class App {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.audioManager = new AudioManager();
    this.loadListeners();
  }

  loadListeners() {
    $('#fileinput').on('change', (e) => this.onFileInput(e));
  }

  onFileInput(event) {
    const el = event.currentTarget;
    if (!el.files || el.files.length <= 0) return;

    const [file] = el.files;
    console.log(file);
    this.audioManager.loadSoundFromFile(file);
  }
}
