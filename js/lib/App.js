class App {
  constructor(options = {}) {
    const defaults = {};
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.audioManager = new AudioManager();
    this.transcriptManager = new TranscriptManager();
    this.loadListeners();
  }

  loadListeners() {
    $('#fileinput').on('change', (e) => this.onFileInput(e));
  }

  onFileInput(event) {
    const el = event.currentTarget;
    if (!el.files || el.files.length <= 0) return;

    let foundMedia = false;
    let foundText = false;
    const foundBoth = _.find(el.files, (file) => {
      const isMedia = file.type.startsWith('audio') || file.type.startsWith('video');
      const isText = file.type.startsWith('text');
      if (!foundMedia && isMedia) {
        this.audioManager.loadSoundFromFile(file);
        foundMedia = true;
      } else if (!foundText && isText) {
        this.transcriptManager.loadTextFromFile(file);
        foundText = true;
      }
      return (foundMedia && foundText);
    });
  }
}
