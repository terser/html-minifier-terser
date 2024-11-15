import Alpine from 'alpinejs';
import HTMLMinifier from '../dist/htmlminifier.esm.bundle.js';
import pkg from '../package.json';
import defaultOptions from './defaultOptions.js';
import Pako from 'pako';
const sillyClone = (o) => JSON.parse(JSON.stringify(o));
const getOptions = (options) => {
  const minifierOptions = {};
  options.forEach((option) => {
    let value = null;
    if (option.type === 'checkbox') {
      value = Boolean(option.checked);
    } else if (!option.value) {
      return;
    } else if (option.type === 'number') {
      value = parseInt(option.value);
    } else {
      value = option.value;
    }
    if (option.id === 'processScripts') {
      value = value.split(/\s*,\s*/);
    }
    minifierOptions[option.id] = value;
  });
  return minifierOptions;
};
Alpine.data('minifier', () => ({
  options: sillyClone(defaultOptions),
  supportsFileReader: 'FileReader' in window,
  input: '',
  output: '',
  stats: {
    result: '',
    text: ''
  },
  variants: [],
  compressGzip(data, level) {
    const start = performance.now();
    const compressed = Pako.gzip(data, { level });
    return {
      size: compressed.length,
      elapsed: (performance.now() - start).toFixed(2)
    };
  },
  compressDeflate(data, level) {
    const start = performance.now();
    const compressed = Pako.deflate(data, { level });
    return {
      size: compressed.length,
      elapsed: (performance.now() - start).toFixed(2)
    };
  },
  selectedFile() {
    const file = this.$refs.file.files[0];
    const reader = new window.FileReader();
    reader.readAsText(file);
    reader.onload = evt => {
      this.input = evt.target.result;
      this.minify();
    };
  },
  async minify() {
    this.stats = {
      result: '',
      text: ''
    };
    const options = getOptions(this.options);
    try {
      this.variants = [];
      const start = performance.now();
      const data = await HTMLMinifier.minify(this.input, options);
      this.elapsed = (performance.now() - start).toFixed(2);
      const diff = this.input.length - data.length;
      const savings = this.input.length ? (100 * diff / this.input.length).toFixed(2) : 0;
      this.output = data;
      this.stats.result = 'success';
      this.stats.text = `Original Size: ${this.input.length}, Minified Size: ${data.length}, Savings: ${diff} (${savings}%)`;
      this.variants = [
        {
          title: 'Original',
          data: this.input
        },
        {
          title: 'Minified',
          data
        }
      ].flatMap(variant => [
        {
          title: `${variant.title} Gzip`,
          size: variant.data.length,
          compression: this.compressGzip(variant.data, options.compressionLevel)
        },
        {
          title: `${variant.title} Deflate`,
          size: variant.data.length,
          compression: this.compressDeflate(variant.data, options.compressionLevel)
        }
      ]);
    } catch (err) {
      this.stats.result = 'failure';
      this.stats.text = err + '';
      this.variants = [];
      console.error(err);
    }
  },
  selectAllOptions(yes = true) {
    this.options = this.options.map((option) => {
      if (option.type !== 'checkbox') {
        return option;
      }
      return {
        ...option,
        checked: Boolean(yes)
      };
    });
  },
  resetOptions() {
    this.options = sillyClone(defaultOptions);
  }
}));
Alpine.start();
document.getElementById('minifer-version').innerText = `(v${pkg.version})`;
