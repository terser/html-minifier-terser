import Alpine from 'alpinejs';
import HTMLMinifier from '../dist/htmlminifier.esm.bundle.js';
import pkg from '../package.json';
import defaultOptions from './defaultOptions.js';
import Pako from 'pako';

const percentage = (a, b) => {
  const diff = a - b;
  const savings = ((100 * diff / a) || 0).toFixed(2);
  return savings;
};

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
  input: '',
  output: '',
  stats: {
    result: '',
    text: '',
    variants: []
  },
  support: {
    fileReader: 'FileReader' in window
  },
  compress(alg, data, level, elapsed = 0) {
    const start = performance.now();
    const compressed =
      alg === 'raw'
        ? data
        : Pako[alg](data, {
          level
        });
    return {
      size: compressed.length,
      elapsed: (elapsed + performance.now() - start).toFixed(2)
    };
  },
  selectFile(event) {
    const file = event.target.files[0];
    const reader = new window.FileReader();
    if (event.target.files.length < 1) {
      return;
    }
    reader.readAsText(file);
    reader.onload = () => {
      this.input = reader.result;
      this.minify();
    };
  },
  async minify() {
    this.stats = {
      result: '',
      text: '',
      variants: []
    };

    const options = getOptions(this.options);
    try {
      const start = performance.now();
      const data = await HTMLMinifier.minify(this.input, options);
      const end = performance.now() - start;
      this.output = data;
      this.stats.result = 'success';
      const algorithms = ['gzip', 'deflate'];
      const levels = [4, 6, 9];
      const variants = [
        ['minified', data, end],
        ['raw', this.input, 0]
      ].flatMap(([title, data, elapsed]) => (
        [
          { title, compression: this.compress('raw', data, 0) },
          ...algorithms.flatMap((alg) =>
            levels.map(
              level => ({
                title: `${title} ${alg} ${level}`,
                compression: this.compress(alg, data, level)
              })
            )
          )
        ]
      ))
        .sort((a, b) => a.compression.size - b.compression.size);
      this.stats.variants = variants;
      this.selectVariant(variants[0]);
    } catch (err) {
      this.stats.result = 'failure';
      this.stats.text = err + '';
      console.error(err);
    }
  },
  selectVariant(selectedVariant) {
    this.selectedVariant = selectedVariant;
    this.stats.variants.forEach(variant => {
      variant.ratio = {
        size: percentage(selectedVariant.compression.size, variant.compression.size),
        elapsed: percentage(selectedVariant.compression.elapsed, variant.compression.elapsed)
      };
    });
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
