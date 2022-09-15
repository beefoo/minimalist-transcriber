class TranscriptManager {
  constructor(options = {}) {
    const defaults = {
      el: '#transcript-text',
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.isLoading = false;
    this.$textarea = $(this.options.el);
  }

  loadTextFromFile(file) {
    if (this.isLoading) return;
    const { $textarea } = this;
    this.isLoading = true;
    const reader = new FileReader();
    reader.addEventListener('progress', (event) => {
      let progress = 0;
      if (event.total && event.loaded && event.loaded > 0 && event.total > 0) {
        progress = Math.round((event.loaded / event.total) * 100);
      }
      $textarea.text(`Loading transcript: ${progress}% complete`);
    });
    reader.addEventListener('load', () => {
      const data = reader.result;
      this.onTextLoad(data);
    });
    $textarea.val('Loading transcript: 0% complete');
    reader.readAsText(file);
  }

  onTextLoad(data) {
    const { $textarea } = this;
    $textarea.val(data);
  }
}
