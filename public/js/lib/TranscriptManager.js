class TranscriptManager {
  constructor(options = {}) {
    const defaults = {
      el: '#transcript-text',
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.storage = new StorageManager();
    this.isLoading = false;
    this.$textarea = $(this.options.el);
    this.$downloadLink = $('#download-link');
    this.loadListeners();
    this.$textarea.val(this.storage.getData());
  }

  download() {
    const text = this.$textarea.val().trim();
    if (text.length <= 0) return;

    const uri = `data:application/txt,${encodeURIComponent(text)}`;
    this.$downloadLink.attr('href', uri);
    this.$downloadLink[0].click();
  }

  loadListeners() {
    const $doc = $(document);

    $('.download').off().on('click', (e) => this.download());

    $doc.off().on('keydown', (e) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case 's':
          e.preventDefault();
          this.download();
          break;
        default:
          break;
      }
    });

    this.$textarea.off().on('input propertychange', (e) => this.onTextChange());
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
    this.$downloadLink.attr('download', file.name);
  }

  onTextChange() {
    this.storage.setData(this.$textarea.val());
  }

  onTextLoad(data) {
    const { $textarea } = this;
    $textarea.val(data);
    $textarea.trigger('input');
  }
}
